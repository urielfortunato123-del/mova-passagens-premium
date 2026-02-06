import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CreateRideRequest {
  origin: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  scheduled_for?: string | null;
}

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

    // Verify user is a passenger
    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || profile?.role !== "passenger") {
      return new Response(
        JSON.stringify({ error: "Only passengers can create rides" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateRideRequest = await req.json();

    // Validate request
    if (!body.origin || !body.destination) {
      return new Response(
        JSON.stringify({ error: "Origin and destination are required" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.origin.lat || !body.origin.lng || !body.origin.address) {
      return new Response(
        JSON.stringify({ error: "Origin must have lat, lng, and address" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.destination.lat || !body.destination.lng || !body.destination.address) {
      return new Response(
        JSON.stringify({ error: "Destination must have lat, lng, and address" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the ride with MATCHING status
    const { data: ride, error: rideError } = await supabaseAdmin
      .from("rides")
      .insert({
        passenger_id: userId,
        status: "MATCHING",
        origin_lat: body.origin.lat,
        origin_lng: body.origin.lng,
        origin_address: body.origin.address,
        dest_lat: body.destination.lat,
        dest_lng: body.destination.lng,
        dest_address: body.destination.address,
        scheduled_for: body.scheduled_for || null,
      })
      .select()
      .single();

    if (rideError) {
      console.error("Ride creation error:", rideError);
      return new Response(
        JSON.stringify({ error: "Failed to create ride" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create ride event
    await supabaseAdmin.from("ride_events").insert({
      ride_id: ride.id,
      event_type: "RIDE_CREATED",
      payload: { passenger_id: userId, status: "MATCHING" },
    });

    // Find nearby drivers using the database function
    const { data: nearbyDrivers, error: driversError } = await supabaseAdmin
      .rpc("find_nearby_drivers", {
        p_lat: body.origin.lat,
        p_lng: body.origin.lng,
        p_limit: 5,
      });

    if (driversError) {
      console.error("Finding drivers error:", driversError);
    }

    // Create offers for nearby drivers
    const expiresAt = new Date(Date.now() + 90 * 1000).toISOString(); // 90 seconds from now
    
    if (nearbyDrivers && nearbyDrivers.length > 0) {
      const offers = nearbyDrivers.map((driver: { driver_id: string; distance_km: number }) => ({
        ride_id: ride.id,
        driver_id: driver.driver_id,
        status: "SENT",
        expires_at: expiresAt,
      }));

      const { error: offersError } = await supabaseAdmin
        .from("ride_offers")
        .insert(offers);

      if (offersError) {
        console.error("Creating offers error:", offersError);
      }

      // Log event
      await supabaseAdmin.from("ride_events").insert({
        ride_id: ride.id,
        event_type: "OFFERS_SENT",
        payload: { 
          driver_count: nearbyDrivers.length,
          drivers: nearbyDrivers.map((d: any) => ({ 
            driver_id: d.driver_id, 
            distance_km: d.distance_km 
          }))
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ride_id: ride.id,
        status: ride.status,
        drivers_notified: nearbyDrivers?.length || 0,
        message: nearbyDrivers?.length 
          ? `Ride created and ${nearbyDrivers.length} drivers notified`
          : "Ride created but no drivers available nearby"
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
