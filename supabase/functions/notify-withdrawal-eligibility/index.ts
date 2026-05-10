// Scheduled hourly. Finds users whose first game_results row is >=7 days old
// and who haven't been notified yet; inserts an in-app notification (which
// auto-fans-out to push) and queues a friendly email.
//
// Eligibility timing is based on absolute UTC instants (now() - first_play),
// so the unlock moment is identical regardless of viewer/server timezone.
// Africa/Lagos is only used for human-readable date *display*.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Candidates: wallets that haven't been notified yet
  const { data: wallets, error: wErr } = await admin
    .from("user_wallets")
    .select("user_id")
    .is("withdrawal_eligibility_notified_at", null);

  if (wErr) {
    return new Response(JSON.stringify({ error: wErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let notified = 0;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  for (const w of wallets ?? []) {
    // First game played for this user
    const { data: firstGame } = await admin
      .from("game_results")
      .select("created_at")
      .eq("user_id", w.user_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstGame?.created_at) continue;
    if (firstGame.created_at > sevenDaysAgo) continue; // not yet 7 days

    // Atomically claim: only mark+notify if still null
    const { data: claimed, error: claimErr } = await admin
      .from("user_wallets")
      .update({ withdrawal_eligibility_notified_at: new Date().toISOString() })
      .eq("user_id", w.user_id)
      .is("withdrawal_eligibility_notified_at", null)
      .select("user_id")
      .maybeSingle();

    if (claimErr || !claimed) continue;

    // In-app notification (push fanout trigger fires automatically)
    await admin.from("notifications").insert({
      user_id: w.user_id,
      title: "🎉 Withdrawals unlocked!",
      message:
        "You've reached 7 days of play — withdrawals are now available on weekends, 6–7 PM (WAT). Cash out your winnings anytime within that window.",
      type: "withdrawal",
    });

    // Optional email
    try {
      const { data: userRes } = await admin.auth.admin.getUserById(w.user_id);
      const email = userRes?.user?.email;
      if (email) {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            template: "daily-nudge",
            to: email,
            data: {
              title: "🎉 Withdrawals are now unlocked",
              message:
                "You've reached 7 days of play on LootBoxx — your account is now eligible to withdraw winnings. Withdrawal window: weekends, 6–7 PM (WAT).",
              ctaLabel: "Withdraw Now",
              ctaUrl: "https://lootboxx.live/withdraw",
            },
          },
        });
      }
    } catch (_) {
      // Don't block on email failures
    }

    notified++;
  }

  return new Response(JSON.stringify({ checked: wallets?.length ?? 0, notified }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
