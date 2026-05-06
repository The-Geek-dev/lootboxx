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
      title = slot === "morning" ? "Complete your account setup" : "Your account is waiting";
      message = "You haven't finished setting up your account yet. Sign in to complete the one-time setup and access your dashboard.";
      ctaLabel = "Open dashboard";
      ctaUrl = `${APP_URL}/deposit`;
    } else if (w.coupon_expires_at && new Date(w.coupon_expires_at) <= now) {
      title = slot === "morning" ? "Your weekly access has ended" : "Renew your weekly access";
      message = "Your weekly access period has ended. You can renew it from your dashboard whenever you're ready.";
      ctaLabel = "Open dashboard";
      ctaUrl = `${APP_URL}/deposit`;
    } else {
      const streakLine = w.current_streak && w.current_streak > 0
        ? ` Your current streak is ${w.current_streak} days.`
        : "";
      const morningPrompts = [
        { t: "Your daily LootBoxx update", m: `Good morning. Your account is active and ready when you are.${streakLine}` },
        { t: "A quick reminder from LootBoxx", m: `Just a heads-up that your account is active today.${streakLine}` },
        { t: "Daily summary from LootBoxx", m: `Here's your daily check-in. Everything looks good on your account.${streakLine}` },
      ];
      const eveningPrompts = [
        { t: "Evening update from LootBoxx", m: `A quick evening check-in on your account.${streakLine}` },
        { t: "Your account summary", m: `Here is your end-of-day account summary.${streakLine}` },
        { t: "Daily LootBoxx digest", m: `A short update on your account activity.${streakLine}` },
      ];
      const prompts = slot === "morning" ? morningPrompts : eveningPrompts;
      const pick = prompts[Math.floor(Math.random() * prompts.length)];
      title = pick.t;
      message = pick.m;
      ctaLabel = "Open dashboard";
      ctaUrl = `${APP_URL}/dashboard`;
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
          await sendNudgeEmail(email, title, message, ctaLabel, ctaUrl, `nudge-${w.user_id}-${today}-${slot}`);
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
