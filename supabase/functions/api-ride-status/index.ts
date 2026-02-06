import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  MATCHING: ["CANCELLED"], // Only passenger can cancel
  ACCEPTED: ["ARRIVING", "CANCELLED"],
  ARRIVING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const { ride_id, status: newStatus } = await req.json();

    if (!ride_id || !newStatus) {
      return new Response(
        JSON.stringify({ error: "ride_id and status are required" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's role
    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current ride
    const { data: ride, error: rideError } = await supabaseAdmin
      .from("rides")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      return new Response(
        JSON.stringify({ error: "Ride not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user is participant
    const isPassenger = ride.passenger_id === userId;
    const isDriver = ride.driver_id === userId;

    if (!isPassenger && !isDriver) {
      return new Response(
        JSON.stringify({ error: "You are not a participant of this ride" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate status transition
    const allowedTransitions = validTransitions[ride.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return new Response(
        JSON.stringify({ 
          error: `Cannot transition from ${ride.status} to ${newStatus}`,
          allowed_transitions: allowedTransitions
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate who can make the transition
    if (newStatus === "CANCELLED") {
      // Passenger can cancel only before ACCEPTED (REQUESTED/MATCHING)
      if (isPassenger && !["REQUESTED", "MATCHING"].includes(ride.status)) {
        return new Response(
          JSON.stringify({ error: "Passenger can only cancel before ride is accepted" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Driver can cancel anytime after accepting
      if (isDriver && !["ACCEPTED", "ARRIVING"].includes(ride.status)) {
        return new Response(
          JSON.stringify({ error: "Driver can only cancel after accepting and before ride starts" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Only driver can change to ARRIVING, IN_PROGRESS, COMPLETED
      if (!isDriver) {
        return new Response(
          JSON.stringify({ error: "Only driver can update ride progress" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update ride status
    const { data: updatedRide, error: updateError } = await supabaseAdmin
      .from("rides")
      .update({ status: newStatus })
      .eq("id", ride_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update ride status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If cancelled, expire all offers
    if (newStatus === "CANCELLED") {
      await supabaseAdmin
        .from("ride_offers")
        .update({ status: "EXPIRED" })
        .eq("ride_id", ride_id)
        .eq("status", "SENT");
    }

    // Create ride event
    await supabaseAdmin.from("ride_events").insert({
      ride_id: ride_id,
      event_type: `STATUS_${newStatus}`,
      payload: { 
        previous_status: ride.status,
        new_status: newStatus,
        updated_by: userId,
        role: profile.role,
        timestamp: new Date().toISOString()
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Ride status updated to ${newStatus}`,
        ride: updatedRide
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
