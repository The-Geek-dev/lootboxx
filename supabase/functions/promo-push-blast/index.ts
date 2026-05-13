// Daily promo push blast to all unactivated users.
// Sends in-app notification + web push. Skips users notified in the last 3 days.
// Auto-stops once the promo end date passes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMO_END = new Date("2026-06-09T23:59:59+01:00");
const CAMPAIGN = "launch_promo_4500";
const COOLDOWN_DAYS = 3;
const ORIGINAL = 7000;
const DISCOUNTED = 4500;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const now = new Date();
    if (now.getTime() > PROMO_END.getTime()) {
      return new Response(JSON.stringify({ skipped: true, reason: "promo_ended" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msLeft = PROMO_END.getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));

    // 1. All unactivated users
    const { data: wallets, error: walletErr } = await supabase
      .from("user_wallets")
      .select("user_id")
      .eq("is_activated", false);
    if (walletErr) throw walletErr;
    if (!wallets?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_unactivated_users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const candidateIds = wallets.map((w) => w.user_id);

    // 2. Filter out users notified in the last COOLDOWN_DAYS
    const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString();
    const { data: recent, error: logErr } = await supabase
      .from("promo_push_log")
      .select("user_id")
      .eq("campaign", CAMPAIGN)
      .gte("sent_at", cutoff)
      .in("user_id", candidateIds);
    if (logErr) throw logErr;
    const recentSet = new Set((recent ?? []).map((r) => r.user_id));
    const targetIds = candidateIds.filter((id) => !recentSet.has(id));

    if (!targetIds.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "all_recently_notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = `🎁 Activate for ₦${DISCOUNTED.toLocaleString()} — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    const message = `Launch promo: pay ₦${DISCOUNTED.toLocaleString()} instead of ₦${ORIGINAL.toLocaleString()} to activate your account. Save ₦${(ORIGINAL - DISCOUNTED).toLocaleString()}. Ends soon!`;

    // 3. Insert in-app notifications (one row per user)
    const notifRows = targetIds.map((user_id) => ({
      user_id,
      title,
      message,
      type: "promo",
    }));
    const { error: notifErr } = await supabase.from("notifications").insert(notifRows);
    if (notifErr) console.error("notif insert error", notifErr);

    // 4. Send web push in parallel via existing send-push function
    const pushUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let pushOk = 0;
    await Promise.all(
      targetIds.map(async (user_id) => {
        try {
          const res = await fetch(pushUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
              apikey: serviceKey,
            },
            body: JSON.stringify({
              user_id,
              title,
              body: message,
              url: "/deposit",
            }),
          });
          if (res.ok) pushOk++;
        } catch (e) {
          console.error("push failed for", user_id, e);
        }
      }),
    );

    // 5. Log sends
    const logRows = targetIds.map((user_id) => ({ user_id, campaign: CAMPAIGN }));
    const { error: insertLogErr } = await supabase.from("promo_push_log").insert(logRows);
    if (insertLogErr) console.error("promo log insert error", insertLogErr);

    return new Response(
      JSON.stringify({
        targeted: targetIds.length,
        notifications_inserted: notifRows.length,
        push_ok: pushOk,
        days_left: daysLeft,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("promo-push-blast error", e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
