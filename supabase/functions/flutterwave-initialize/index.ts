import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const FLUTTERWAVE_SECRET = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  if (!FLUTTERWAVE_SECRET) {
    return new Response(JSON.stringify({ error: "Flutterwave not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { amount, email, metadata, currency, redirect_url } = await req.json();

    if (!amount || !email) {
      return new Response(JSON.stringify({ error: "Amount and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tx_ref = `LB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: currency || "NGN",
        redirect_url: redirect_url || metadata?.callback_url || undefined,
        customer: { email },
        meta: {
          ...metadata,
          platform: "LootBoxx",
        },
        customizations: {
          title: "LootBoxx",
          description: "LootBoxx Deposit",
          logo: "https://lootboxx.lovable.app/og-image.svg",
        },
      }),
    });

    const data = await response.json();

    const userId = metadata?.user_id;
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (data.status !== "success") {
      if (userId) {
        try {
          await svc.from("payment_attempts").insert({
            user_id: userId, provider: "flutterwave", reference: tx_ref,
            amount: Number(amount), deposit_type: metadata?.deposit_type,
            status: "init_failed", error_message: data.message || "init failed",
          });
        } catch {}
      }
      return new Response(JSON.stringify({ error: data.message || "Failed to initialize payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId) {
      try {
        await svc.from("payment_attempts").insert({
          user_id: userId, provider: "flutterwave", reference: tx_ref,
          amount: Number(amount), deposit_type: metadata?.deposit_type,
          status: "initiated",
          metadata: { bonus: Number(metadata?.bonus || 0), points_reward: Number(metadata?.points_reward || 0) },
        });
      } catch {}
    }

    return new Response(JSON.stringify({
      authorization_url: data.data.link,
      tx_ref,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
