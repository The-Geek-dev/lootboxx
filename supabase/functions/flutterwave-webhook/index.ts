import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const FLUTTERWAVE_SECRET = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  if (!FLUTTERWAVE_SECRET) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify webhook signature
  const secretHash = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");
  const signature = req.headers.get("verif-hash");
  if (secretHash && signature !== secretHash) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    const event = payload.event;
    const data = payload.data;

    // Only process successful charges
    if (event !== "charge.completed" || data.status !== "successful") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-verify with Flutterwave API for security
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
      { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET}` } }
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data.status !== "successful") {
      console.error("Webhook verification failed:", verifyData);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txn = verifyData.data;
    const amountNaira = txn.amount;
    const userId = txn.meta?.user_id;
    const depositType = txn.meta?.deposit_type;
    const bonus = Number(txn.meta?.bonus || 0);
    const pointsReward = Number(txn.meta?.points_reward || 0);
    const reference = txn.tx_ref;

    if (!userId) {
      console.error("No user_id in transaction meta");
      return new Response(JSON.stringify({ error: "No user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("deposits")
      .select("id")
      .eq("payment_reference", reference)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ status: "already_processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record deposit
    await supabase.from("deposits").insert({
      user_id: userId,
      amount: amountNaira,
      status: "completed",
      payment_reference: reference,
    });

    // Get wallet
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance, total_deposited, is_activated, coupon_expires_at, points")
      .eq("user_id", userId)
      .single();

    if (!wallet) {
      console.error("Wallet not found for user:", userId);
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalCredit = amountNaira + bonus;
    const updates: Record<string, unknown> = {
      balance: Number(wallet.balance) + totalCredit,
      total_deposited: Number(wallet.total_deposited) + amountNaira,
      points: Number(wallet.points) + pointsReward,
    };

    if (depositType === "activation" && !wallet.is_activated) {
      updates.is_activated = true;
      updates.coupon_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (depositType === "renewal") {
      const currentExpiry = wallet.coupon_expires_at ? new Date(wallet.coupon_expires_at) : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      updates.coupon_expires_at = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase.from("user_wallets").update(updates).eq("user_id", userId);

    // Notify user
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Payment Successful! 🎉",
      message: `₦${totalCredit.toLocaleString()} credited to your wallet${bonus > 0 ? ` (includes ₦${bonus.toLocaleString()} bonus)` : ""}. +${pointsReward.toLocaleString()} points earned!`,
      type: "deposit",
    });

    console.log(`Webhook processed: ${reference} — ₦${totalCredit} for user ${userId}`);

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
