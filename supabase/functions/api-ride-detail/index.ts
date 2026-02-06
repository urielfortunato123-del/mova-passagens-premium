import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Get ride_id from URL
    const url = new URL(req.url);
    const ride_id = url.searchParams.get("ride_id");

    if (!ride_id) {
      return new Response(
        JSON.stringify({ error: "ride_id is required" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ride with related data (RLS will filter automatically)
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select(`
        *,
        passenger:users_profile!rides_passenger_id_fkey (
          id,
          full_name,
          phone
        ),
        driver:users_profile!rides_driver_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq("id", ride_id)
      .single();

    if (rideError) {
      if (rideError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Ride not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Ride fetch error:", rideError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch ride" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get driver vehicle info if driver is assigned
    let driverInfo = null;
    if (ride.driver_id) {
      const { data: driverProfile } = await supabase
        .from("driver_profiles")
        .select("vehicle_plate, vehicle_model, vehicle_year, last_lat, last_lng")
        .eq("user_id", ride.driver_id)
        .single();
      
      if (driverProfile) {
        driverInfo = {
          ...ride.driver,
          ...driverProfile
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ride: {
          ...ride,
          driver: driverInfo || ride.driver
        }
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
