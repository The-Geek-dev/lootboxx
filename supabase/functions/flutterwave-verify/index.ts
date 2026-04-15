import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { transaction_id, tx_ref } = await req.json();

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "transaction_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Flutterwave
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
      {
        headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET}` },
      }
    );

    const data = await response.json();

    if (data.status !== "success" || data.data.status !== "successful") {
      return new Response(JSON.stringify({
        error: "Payment not verified",
        details: data.data?.processor_response || "Transaction failed",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txn = data.data;
    const amountNaira = txn.amount;
    const userId = txn.meta?.user_id;
    const depositType = txn.meta?.deposit_type;
    const bonus = Number(txn.meta?.bonus || 0);
    const pointsReward = Number(txn.meta?.points_reward || 0);
    const reference = txn.tx_ref || tx_ref;

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user_id in metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate reference
    const { data: existingDeposit } = await supabase
      .from("deposits")
      .select("id")
      .eq("payment_reference", reference)
      .limit(1);

    if (existingDeposit && existingDeposit.length > 0) {
      return new Response(JSON.stringify({ error: "Transaction already processed" }), {
        status: 409,
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

    // Get current wallet
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance, total_deposited, is_activated, coupon_expires_at, points")
      .eq("user_id", userId)
      .single();

    if (!wallet) {
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

    // Handle activation
    if (depositType === "activation" && !wallet.is_activated) {
      updates.is_activated = true;
      updates.coupon_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Handle renewal
    if (depositType === "renewal") {
      const currentExpiry = wallet.coupon_expires_at ? new Date(wallet.coupon_expires_at) : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      updates.coupon_expires_at = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase
      .from("user_wallets")
      .update(updates)
      .eq("user_id", userId);

    // Send notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Payment Successful! 🎉",
      message: `₦${totalCredit.toLocaleString()} credited to your wallet${bonus > 0 ? ` (includes ₦${bonus.toLocaleString()} bonus)` : ""}. +${pointsReward.toLocaleString()} points earned!`,
      type: "deposit",
    });

    return new Response(JSON.stringify({
      success: true,
      amount: amountNaira,
      bonus,
      totalCredit,
      pointsReward,
      depositType,
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
