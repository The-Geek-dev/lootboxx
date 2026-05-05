// Engagement nudge — runs in two slots per day:
//   morning + evening = in-app notifications (twice/day)
//   morning slot only = email nudge (once/day)
// Tailors message to user state: not activated, expired coupon, or active.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://lootboxx.live";

async function sendNudgeEmail(to: string, title: string, message: string, ctaLabel: string, ctaUrl: string, idempotencyKey: string) {
  if (!to) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        templateName: "daily-nudge",
        recipientEmail: to,
        idempotencyKey,
        templateData: { title, message, ctaLabel, ctaUrl },
      }),
    });
  } catch (_) { /* swallow */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  // Morning slot = before 12:00 UTC; evening slot otherwise. Email only in morning slot.
  const slot = now.getUTCHours() < 12 ? "morning" : "evening";
  const slotType = `daily_nudge_${slot}`;
  const sendEmailThisRun = slot === "morning";

  const { data: wallets, error } = await supabase
    .from("user_wallets")
    .select("user_id, is_activated, coupon_expires_at, current_streak");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0, skipped = 0, emailed = 0;

  for (const w of wallets || []) {
    // Skip if a nudge for this slot was already sent today
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", w.user_id)
      .eq("type", slotType)
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    let title = "";
    let message = "";
    let ctaLabel = "Open LootBoxx";
    let ctaUrl = APP_URL;

    if (!w.is_activated) {
      title = slot === "morning" ? "🎁 Activate your account today!" : "⏳ Don't sleep on it — activate tonight";
      message = "Pay ₦7,000 once to unlock games, raffles, and weekly bonuses. Your welcome bonus is waiting.";
      ctaLabel = "Activate Now";
      ctaUrl = `${APP_URL}/deposit`;
    } else if (w.coupon_expires_at && new Date(w.coupon_expires_at) <= now) {
      title = slot === "morning" ? "⏰ Your coupon expired — renew now" : "🔁 Renew tonight to keep playing";
      message = "Your weekly coupon has expired. Renew for ₦2,000 to get back in the action and keep earning.";
      ctaLabel = "Renew Coupon";
      ctaUrl = `${APP_URL}/deposit`;
    } else {
      const streakLine = w.current_streak && w.current_streak > 0
        ? ` You're on a ${w.current_streak}-day streak — don't break it!`
        : "";
      const morningPrompts = [
        { t: "☀️ Good morning — your spins await", m: `Start your day with a spin or two. Quick wins, real cash.${streakLine}` },
        { t: "🎮 Play before work", m: `Five minutes on the wheel could be your luckiest move today.${streakLine}` },
        { t: "🔥 Keep your streak alive", m: `Open the app, play one round, keep your XP climbing.${streakLine}` },
      ];
      const eveningPrompts = [
        { t: "🌙 Evening wind-down — play & win", m: `End your day with raffles, slots, or trivia.${streakLine}` },
        { t: "💰 Convert your points before bed", m: `Got 5,000+ points? Turn them into cash in seconds.${streakLine}` },
        { t: "🏆 Climb the leaderboard tonight", m: `A few rounds now could move you up the rankings by morning.${streakLine}` },
      ];
      const prompts = slot === "morning" ? morningPrompts : eveningPrompts;
      const pick = prompts[Math.floor(Math.random() * prompts.length)];
      title = pick.t;
      message = pick.m;
      ctaLabel = "Play Now";
      ctaUrl = `${APP_URL}/games`;
    }

    await supabase.from("notifications").insert({
      user_id: w.user_id,
      title,
      message,
      type: slotType,
    });
    sent++;

    // Email — only morning slot, only if user has email + opted in
    if (sendEmailThisRun) {
      // Ensure preferences row exists
      const { data: pref } = await supabase
        .from("email_preferences")
        .select("nudge_emails_enabled, unsubscribe_token")
        .eq("user_id", w.user_id)
        .maybeSingle();

      let token = pref?.unsubscribe_token;
      let enabled = pref?.nudge_emails_enabled ?? true;

      if (!pref) {
        const { data: created } = await supabase
          .from("email_preferences")
          .insert({ user_id: w.user_id })
          .select("unsubscribe_token, nudge_emails_enabled")
          .maybeSingle();
        token = created?.unsubscribe_token;
        enabled = created?.nudge_emails_enabled ?? true;
      }

      if (enabled && token) {
        const { data: userRes } = await supabase.auth.admin.getUserById(w.user_id);
        const email = userRes?.user?.email;
        if (email) {
          const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/nudge-unsubscribe?token=${token}`;
          await sendEmail(email, title, emailWrap(title, message, { label: ctaLabel, url: ctaUrl }, unsubscribeUrl));
          emailed++;
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ slot, sent, skipped, emailed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
