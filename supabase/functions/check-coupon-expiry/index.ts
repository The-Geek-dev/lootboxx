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

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // Find users whose coupon expires within the next 24 hours and hasn't expired yet
  const { data: expiringUsers, error } = await supabase
    .from("user_wallets")
    .select("user_id, coupon_expires_at")
    .eq("is_activated", true)
    .gt("coupon_expires_at", now.toISOString())
    .lte("coupon_expires_at", in24Hours);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let notified = 0;

  for (const user of expiringUsers || []) {
    const expiresAt = new Date(user.coupon_expires_at);
    const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Check if we already sent this notification today
    const today = now.toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("type", "coupon_expiry")
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    await supabase.from("notifications").insert({
      user_id: user.user_id,
      title: "⚠️ Coupon Expiring Soon!",
      message: `Your weekly coupon expires in ${hoursLeft} hours. Renew now for ₦2,000 to keep playing!`,
      type: "coupon_expiry",
    });

    notified++;
  }

  return new Response(
    JSON.stringify({ message: `Notified ${notified} users about expiring coupons` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
