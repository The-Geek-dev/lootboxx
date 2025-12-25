import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const path = url.pathname.replace("/trading-bot-api", "");
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Hash the API key for comparison
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Validate API key
    const { data: apiKeyRecord, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (keyError || !apiKeyRecord) {
      console.log("Invalid API key attempted");
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update last used
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    const userId = apiKeyRecord.user_id;
    const permissions = apiKeyRecord.permissions;

    // Route handling
    if (path === "/status" || path === "") {
      // GET /status - Bot status
      if (!permissions.includes("read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient permissions" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const response = {
        status: "active",
        user_id: userId,
        bot: {
          name: "SQUANCH Trading Bot",
          version: "1.0.0",
          strategy: "Aggressive Growth",
          risk_level: "Medium",
        },
        stats: {
          total_profit: 0,
          active_trades: 0,
          win_rate: 0,
          monthly_roi: 0,
          trades_today: 0,
        },
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (path === "/config") {
      if (req.method === "GET") {
        if (!permissions.includes("read")) {
          return new Response(
            JSON.stringify({ error: "Insufficient permissions" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const config = {
          user_id: userId,
          settings: {
            strategy: "aggressive_growth",
            risk_level: "medium",
            max_trade_amount: 1000,
            stop_loss_percent: 5,
            take_profit_percent: 15,
            auto_compound: true,
            notification_enabled: true,
          },
        };

        return new Response(JSON.stringify(config), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (req.method === "POST" || req.method === "PUT") {
        if (!permissions.includes("write")) {
          return new Response(
            JSON.stringify({ error: "Insufficient permissions - write access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const body = await req.json();
        console.log("Config update requested:", body);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Configuration updated successfully",
            config: body 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    if (path === "/trades") {
      if (!permissions.includes("read")) {
        return new Response(
          JSON.stringify({ error: "Insufficient permissions" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const trades = {
        user_id: userId,
        trades: [],
        pagination: {
          page: 1,
          per_page: 20,
          total: 0,
        },
      };

      return new Response(JSON.stringify(trades), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: ["/status", "/config", "/trades"]
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in trading-bot-api function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
