import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQUAD_BASE = "https://api-d.squadco.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SQUAD_SECRET = Deno.env.get("SQUAD_SECRET_KEY");
    if (!SQUAD_SECRET) return json({ error: "Squad not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return json({ error: "Unauthorized", details: userErr?.message }, 401);
    }
    const userId = userData.user.id;

    const { transaction_ref } = await req.json();
    if (!transaction_ref) return json({ error: "transaction_ref required" }, 400);

    const verifyRes = await fetch(
      `${SQUAD_BASE}/transaction/verify/${encodeURIComponent(transaction_ref)}`,
      { headers: { Authorization: `Bearer ${SQUAD_SECRET}` } },
    );
    const data = await verifyRes.json();

    if (!verifyRes.ok || data.status !== 200) {
      return json({ error: data.message || "Verification failed", details: data }, 400);
    }

    const txn = data.data;
    if (txn.transaction_status?.toLowerCase() !== "success") {
      return json({ success: false, status: txn.transaction_status, message: "Payment not completed" });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Idempotency check
    const { data: existing } = await admin
      .from("deposits")
      .select("id")
      .eq("payment_reference", transaction_ref)
      .limit(1);
    if (existing && existing.length > 0) {
      return json({ success: true, message: "Already credited", status: "already_processed" });
    }

    const meta = txn.meta ?? {};
    const metaUserId = meta.user_id as string;
    if (metaUserId && metaUserId !== userId) {
      return json({ error: "User mismatch" }, 403);
    }

    const amountNaira = Number(txn.transaction_amount) / 100;
    const bonus = Number(meta.bonus || 0);
    const points = Number(meta.points_reward || 0);
    const depositType = (meta.deposit_type as string) || "topup";

    // Credit via existing RPC, but pass the squad ref
    const { error: creditErr } = await admin.rpc("credit_verified_deposit", {
      p_user_id: userId,
      p_amount: amountNaira,
      p_bonus: bonus,
      p_points: points,
      p_deposit_type: depositType,
    });
    if (creditErr) {
      console.error("credit error:", creditErr);
      return json({ error: "Credit failed", details: creditErr.message }, 500);
    }

    // Overwrite the auto-generated reference with the squad ref for traceability
    await admin
      .from("deposits")
      .update({ payment_reference: transaction_ref })
      .eq("user_id", userId)
      .like("payment_reference", "kuda-manual-%")
      .order("created_at", { ascending: false })
      .limit(1);

    await admin.from("notifications").insert({
      user_id: userId,
      title: "Payment Successful! 🎉",
      message: `₦${(amountNaira + bonus).toLocaleString()} credited to your wallet${bonus > 0 ? ` (includes ₦${bonus.toLocaleString()} bonus)` : ""}.${points > 0 ? ` +${points.toLocaleString()} pts` : ""}`,
      type: "deposit",
    });

    return json({ success: true, status: "verified", amount: amountNaira, bonus, points });
  } catch (err: any) {
    console.error("squad-verify error:", err);
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
