import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OnboardingRequest {
  role: "passenger" | "driver";
  full_name: string;
  phone?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_year?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "NO_AUTH" }),
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
        JSON.stringify({ error: "Invalid token", code: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const body: OnboardingRequest = await req.json();

    // Validate required fields
    if (!body.role || !["passenger", "driver"].includes(body.role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'passenger' or 'driver'", code: "INVALID_ROLE" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.full_name || body.full_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Full name is required", code: "INVALID_NAME" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for inserting profiles
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("users_profile")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          message: "Profile already exists", 
          profile: existingProfile,
          code: "PROFILE_EXISTS" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create users_profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users_profile")
      .insert({
        id: userId,
        role: body.role,
        full_name: body.full_name.trim(),
        phone: body.phone || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to create profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If driver, also create driver_profiles
    if (body.role === "driver") {
      const { error: driverError } = await supabaseAdmin
        .from("driver_profiles")
        .insert({
          user_id: userId,
          vehicle_plate: body.vehicle_plate || null,
          vehicle_model: body.vehicle_model || null,
          vehicle_year: body.vehicle_year || null,
          is_online: false,
        });

      if (driverError) {
        console.error("Driver profile creation error:", driverError);
        // Rollback users_profile
        await supabaseAdmin.from("users_profile").delete().eq("id", userId);
        return new Response(
          JSON.stringify({ error: "Failed to create driver profile", details: driverError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Profile created successfully",
        profile 
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
