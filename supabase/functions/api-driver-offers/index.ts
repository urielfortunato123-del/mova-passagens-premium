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

    // Verify user is a driver
    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || profile?.role !== "driver") {
      return new Response(
        JSON.stringify({ error: "Only drivers can view offers" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active offers for this driver
    const now = new Date().toISOString();
    
    const { data: offers, error: offersError } = await supabase
      .from("ride_offers")
      .select(`
        id,
        status,
        expires_at,
        created_at,
        ride:rides (
          id,
          origin_lat,
          origin_lng,
          origin_address,
          dest_lat,
          dest_lng,
          dest_address,
          scheduled_for,
          price_cents,
          status,
          passenger:users_profile!rides_passenger_id_fkey (
            full_name,
            phone
          )
        )
      `)
      .eq("driver_id", userId)
      .eq("status", "SENT")
      .gt("expires_at", now)
      .order("created_at", { ascending: false });

    if (offersError) {
      console.error("Offers fetch error:", offersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch offers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out offers for rides that are no longer MATCHING
    const activeOffers = offers?.filter(
      (offer: any) => offer.ride?.status === "MATCHING"
    ) || [];

    return new Response(
      JSON.stringify({ 
        success: true,
        offers: activeOffers,
        count: activeOffers.length
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
