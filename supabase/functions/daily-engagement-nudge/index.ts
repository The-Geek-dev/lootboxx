// Daily engagement nudge — buzzes every user with one notification per day:
// - "new" (not activated): prompt to activate with ₦7,000
// - "expired" (coupon expired): prompt to renew
// - "active" (coupon valid): prompt to come play & earn
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Fetch all wallets — paged
  const { data: wallets, error } = await supabase
    .from("user_wallets")
    .select("user_id, is_activated, coupon_expires_at");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let skipped = 0;

  for (const w of wallets || []) {
    // Skip if a daily-nudge was already sent today
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", w.user_id)
      .eq("type", "daily_nudge")
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    let title = "";
    let message = "";

    if (!w.is_activated) {
      title = "🎁 Activate your account today!";
      message = "Pay ₦7,000 once to unlock games, raffles, and weekly bonuses. Don't miss out!";
    } else if (w.coupon_expires_at && new Date(w.coupon_expires_at) <= now) {
      title = "⏰ Your coupon has expired";
      message = "Renew now to get back in the action and keep earning rewards.";
    } else {
      // Pick one of several "active" prompts to keep it fresh
      const prompts = [
        { t: "🎮 Time to play!", m: "Spin the wheel, play slots, or join the raffle to grow your balance today." },
        { t: "🔥 Daily streak waiting", m: "A round or two a day keeps your XP up. Jump in now!" },
        { t: "💰 Convert your points", m: "Got 5,000+ points? Convert them to cash and stack your wins." },
        { t: "🏆 Climb the leaderboard", m: "Top players win big. Play a few games and rise up the ranks." },
      ];
      const pick = prompts[Math.floor(Math.random() * prompts.length)];
      title = pick.t;
      message = pick.m;
    }

    await supabase.from("notifications").insert({
      user_id: w.user_id,
      title,
      message,
      type: "daily_nudge",
    });

    sent++;
  }

  return new Response(
    JSON.stringify({ message: `Daily nudges sent: ${sent}, skipped: ${skipped}` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
