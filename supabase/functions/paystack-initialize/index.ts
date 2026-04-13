import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!PAYSTACK_SECRET) {
    return new Response(JSON.stringify({ error: "Paystack not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { amount, email, metadata } = await req.json();

    if (!amount || !email) {
      return new Response(JSON.stringify({ error: "Amount and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Paystack amounts are in kobo (₦1 = 100 kobo)
    const amountInKobo = amount * 100;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInKobo,
        email,
        metadata: {
          ...metadata,
          custom_fields: [
            { display_name: "Platform", variable_name: "platform", value: "LootBox" },
          ],
        },
        callback_url: metadata?.callback_url || undefined,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return new Response(JSON.stringify({ error: data.message || "Failed to initialize" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
