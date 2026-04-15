import { corsHeaders } from "@supabase/supabase-js/cors";

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

    if (data.status !== "success") {
      return new Response(JSON.stringify({ error: data.message || "Failed to initialize payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
