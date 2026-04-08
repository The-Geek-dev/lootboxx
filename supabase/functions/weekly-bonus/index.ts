import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all activated users who haven't received a bonus in the last 7 days
  const { data: eligibleUsers, error } = await supabase
    .from("user_wallets")
    .select("id, user_id, balance, last_weekly_bonus_at")
    .eq("is_activated", true)
    .or(`last_weekly_bonus_at.is.null,last_weekly_bonus_at.lt.${oneWeekAgo}`);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const WEEKLY_BONUS = 2000;
  let credited = 0;

  for (const user of eligibleUsers || []) {
    const { error: updateError } = await supabase
      .from("user_wallets")
      .update({
        balance: Number(user.balance) + WEEKLY_BONUS,
        last_weekly_bonus_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!updateError) credited++;
  }

  return new Response(
    JSON.stringify({ message: `Weekly bonus credited to ${credited} users` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
