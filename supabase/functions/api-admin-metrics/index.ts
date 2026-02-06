import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ApiKeyValidation {
  key_id: string;
  key_name: string;
  scopes: string[];
  is_valid: boolean;
}

async function validateApiKey(apiKey: string): Promise<ApiKeyValidation | null> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabaseAdmin
    .rpc("validate_api_key", { p_api_key: apiKey });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as ApiKeyValidation;
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes("*") || scopes.includes(requiredScope);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API Key from headers
    const apiKey = req.headers.get("x-api-key") || 
                   req.headers.get("authorization")?.replace("ApiKey ", "");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "API Key required", 
          code: "NO_API_KEY",
          hint: "Include header: X-API-KEY: mova_live_xxx or Authorization: ApiKey mova_live_xxx"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate API Key
    const validation = await validateApiKey(apiKey);

    if (!validation) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API Key", code: "INVALID_API_KEY" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse URL to get action
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "summary";

    // ========================================
    // ACTION: summary (dashboard overview)
    // ========================================
    if (action === "summary") {
      if (!hasScope(validation.scopes, "metrics:read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient scope", required: "metrics:read" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get counts
      const [
        { count: totalPassengers },
        { count: totalDrivers },
        { count: totalRides },
        { count: completedRides },
        { count: activeRides },
        { count: onlineDrivers },
      ] = await Promise.all([
        supabaseAdmin.from("users_profile").select("*", { count: "exact", head: true }).eq("role", "passenger"),
        supabaseAdmin.from("users_profile").select("*", { count: "exact", head: true }).eq("role", "driver"),
        supabaseAdmin.from("rides").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("rides").select("*", { count: "exact", head: true }).eq("status", "COMPLETED"),
        supabaseAdmin.from("rides").select("*", { count: "exact", head: true }).in("status", ["MATCHING", "ACCEPTED", "ARRIVING", "IN_PROGRESS"]),
        supabaseAdmin.from("driver_profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            users: {
              passengers: totalPassengers || 0,
              drivers: totalDrivers || 0,
              total: (totalPassengers || 0) + (totalDrivers || 0),
            },
            rides: {
              total: totalRides || 0,
              completed: completedRides || 0,
              active: activeRides || 0,
            },
            drivers: {
              online: onlineDrivers || 0,
            },
          },
          api_key_name: validation.key_name,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: rides (list rides with filters)
    // ========================================
    if (action === "rides") {
      if (!hasScope(validation.scopes, "rides:read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient scope", required: "rides:read" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const status = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const from = url.searchParams.get("from"); // ISO date
      const to = url.searchParams.get("to"); // ISO date

      let query = supabaseAdmin
        .from("rides")
        .select(`
          *,
          passenger:users_profile!rides_passenger_id_fkey(full_name, phone),
          driver:users_profile!rides_driver_id_fkey(full_name, phone)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("status", status);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);

      const { data: rides, count, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch rides", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: rides,
          pagination: {
            total: count,
            limit,
            offset,
            has_more: (offset + limit) < (count || 0),
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: finance (financial report)
    // ========================================
    if (action === "finance") {
      if (!hasScope(validation.scopes, "finance:read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient scope", required: "finance:read" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = url.searchParams.get("to") || new Date().toISOString();

      const { data: rides, error } = await supabaseAdmin
        .from("rides")
        .select("id, status, price_cents, created_at")
        .eq("status", "COMPLETED")
        .gte("created_at", from)
        .lte("created_at", to);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch financial data", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalRevenue = rides?.reduce((sum, r) => sum + (r.price_cents || 0), 0) || 0;
      const rideCount = rides?.length || 0;
      const avgTicket = rideCount > 0 ? Math.round(totalRevenue / rideCount) : 0;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            period: { from, to },
            total_revenue_cents: totalRevenue,
            total_revenue_brl: (totalRevenue / 100).toFixed(2),
            completed_rides: rideCount,
            average_ticket_cents: avgTicket,
            average_ticket_brl: (avgTicket / 100).toFixed(2),
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: drivers (list drivers)
    // ========================================
    if (action === "drivers") {
      if (!hasScope(validation.scopes, "drivers:read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient scope", required: "drivers:read" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: drivers, error } = await supabaseAdmin
        .from("driver_profiles")
        .select(`
          *,
          user:users_profile!driver_profiles_user_id_fkey(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch drivers", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: drivers,
          count: drivers?.length || 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: export (CSV export)
    // ========================================
    if (action === "export") {
      if (!hasScope(validation.scopes, "export:read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient scope", required: "export:read" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const type = url.searchParams.get("type") || "rides";
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");

      if (type === "rides") {
        let query = supabaseAdmin
          .from("rides")
          .select(`
            id, status, origin_address, dest_address, price_cents, created_at,
            passenger:users_profile!rides_passenger_id_fkey(full_name),
            driver:users_profile!rides_driver_id_fkey(full_name)
          `)
          .order("created_at", { ascending: false });

        if (from) query = query.gte("created_at", from);
        if (to) query = query.lte("created_at", to);

        const { data: rides, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Export failed", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate CSV
        const headers = ["ID", "Status", "Origem", "Destino", "Valor (R$)", "Passageiro", "Motorista", "Data"];
        const rows = rides?.map(r => [
          r.id,
          r.status,
          `"${r.origin_address}"`,
          `"${r.dest_address}"`,
          ((r.price_cents || 0) / 100).toFixed(2),
          r.passenger?.full_name || "",
          r.driver?.full_name || "",
          r.created_at,
        ]) || [];

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="mova_rides_${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }

      return new Response(
        JSON.stringify({ error: "Invalid export type", valid_types: ["rides"] }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ 
        error: "Unknown action", 
        valid_actions: ["summary", "rides", "finance", "drivers", "export"] 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Admin metrics error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
