import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-squad-encrypted-body",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const SQUAD_SECRET = Deno.env.get("SQUAD_SECRET_KEY");
  if (!SQUAD_SECRET) return new Response("Not configured", { status: 500 });

  try {
    const rawBody = await req.text();

    // Verify signature - Squad sends HMAC-SHA512 of raw body using secret key
    const signature = req.headers.get("x-squad-encrypted-body") ?? "";
    if (signature) {
      const expected = createHmac("sha512", SQUAD_SECRET).update(rawBody).digest("hex").toUpperCase();
      if (expected !== signature.toUpperCase()) {
        console.warn("Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.Event ?? payload.event;
    const txn = payload.TransactionRef ? payload : payload.Body ?? payload;
    const data = txn.Body ?? txn;

    // Only process successful charges
    const status = (data.transaction_status ?? data.TransactionStatus ?? "").toString().toLowerCase();
    if (status !== "success") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionRef = data.transaction_ref ?? data.TransactionRef;
    const meta = data.meta ?? data.Meta ?? {};
    const userId = meta.user_id;
    if (!userId || !transactionRef) {
      return new Response("Missing fields", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency
    const { data: existing } = await supabase
      .from("deposits")
      .select("id")
      .eq("payment_reference", transactionRef)
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ status: "already_processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountNaira = Number(data.transaction_amount ?? data.TransactionAmount) / 100;
    const bonus = Number(meta.bonus || 0);
    const points = Number(meta.points_reward || 0);
    const depositType = (meta.deposit_type as string) || "topup";

    const { error: creditErr } = await supabase.rpc("credit_verified_deposit", {
      p_user_id: userId,
      p_amount: amountNaira,
      p_bonus: bonus,
      p_points: points,
      p_deposit_type: depositType,
    });
    if (creditErr) {
      console.error("Webhook credit failed:", creditErr);
      return new Response("Credit failed", { status: 500 });
    }

    await supabase
      .from("deposits")
      .update({ payment_reference: transactionRef })
      .eq("user_id", userId)
      .like("payment_reference", "kuda-manual-%")
      .order("created_at", { ascending: false })
      .limit(1);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Payment Successful! 🎉",
      message: `₦${(amountNaira + bonus).toLocaleString()} credited to your wallet.`,
      type: "deposit",
    });

    console.log(`Squad webhook processed: ${transactionRef} for user ${userId}`);
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("squad-webhook error:", err);
    return new Response(`Error: ${err?.message}`, { status: 500 });
  }
});
