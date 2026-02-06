import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const { ride_id } = await req.json();

    if (!ride_id) {
      return new Response(
        JSON.stringify({ error: "ride_id is required" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a driver
    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("role, full_name")
      .eq("id", userId)
      .single();

    if (profileError || profile?.role !== "driver") {
      return new Response(
        JSON.stringify({ error: "Only drivers can accept rides" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if driver has a valid offer for this ride
    const now = new Date().toISOString();
    const { data: offer, error: offerError } = await supabaseAdmin
      .from("ride_offers")
      .select("id, status, expires_at")
      .eq("ride_id", ride_id)
      .eq("driver_id", userId)
      .eq("status", "SENT")
      .gt("expires_at", now)
      .single();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: "No valid offer found for this ride", code: "NO_VALID_OFFER" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if ride is still in MATCHING status
    const { data: ride, error: rideError } = await supabaseAdmin
      .from("rides")
      .select("id, status, passenger_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      return new Response(
        JSON.stringify({ error: "Ride not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (ride.status !== "MATCHING") {
      return new Response(
        JSON.stringify({ 
          error: "Ride is no longer available", 
          code: "RIDE_NOT_AVAILABLE",
          current_status: ride.status
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TRANSACTION: Accept the offer and update the ride
    // 1. Update this offer to ACCEPTED
    const { error: acceptError } = await supabaseAdmin
      .from("ride_offers")
      .update({ status: "ACCEPTED" })
      .eq("id", offer.id);

    if (acceptError) {
      console.error("Accept offer error:", acceptError);
      return new Response(
        JSON.stringify({ error: "Failed to accept offer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Update ride with driver and status
    const { data: updatedRide, error: updateRideError } = await supabaseAdmin
      .from("rides")
      .update({ 
        driver_id: userId, 
        status: "ACCEPTED" 
      })
      .eq("id", ride_id)
      .eq("status", "MATCHING") // Double check - prevents race conditions
      .select()
      .single();

    if (updateRideError) {
      // Rollback offer
      await supabaseAdmin
        .from("ride_offers")
        .update({ status: "SENT" })
        .eq("id", offer.id);

      return new Response(
        JSON.stringify({ error: "Ride was accepted by another driver", code: "RACE_CONDITION" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Expire all other offers for this ride
    await supabaseAdmin
      .from("ride_offers")
      .update({ status: "EXPIRED" })
      .eq("ride_id", ride_id)
      .neq("id", offer.id);

    // 4. Create ride event
    await supabaseAdmin.from("ride_events").insert({
      ride_id: ride_id,
      event_type: "RIDE_ACCEPTED",
      payload: { 
        driver_id: userId,
        driver_name: profile.full_name,
        accepted_at: new Date().toISOString()
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Ride accepted successfully",
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
