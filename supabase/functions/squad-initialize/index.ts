import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQUAD_BASE = "https://api-d.squadco.com"; // live base
// Note: Squad uses api-d.squadco.com for live and sandbox-api-d.squadco.com for sandbox

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SQUAD_SECRET = Deno.env.get("SQUAD_SECRET_KEY");
    if (!SQUAD_SECRET) return json({ error: "Squad not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return json({ error: "Unauthorized", details: userErr?.message }, 401);
    }
    const userId = userData.user.id;
    const email = userData.user.email ?? "user@lootboxx.live";

    const body = await req.json();
    const { amount, deposit_type, bonus, points_reward, callback_url } = body ?? {};
    if (!amount || amount < 100) return json({ error: "Invalid amount" }, 400);
    if (!deposit_type) return json({ error: "deposit_type required" }, 400);

    const transaction_ref = `LB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const initRes = await fetch(`${SQUAD_BASE}/transaction/initiate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SQUAD_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // Squad expects kobo
        email,
        currency: "NGN",
        initiate_type: "inline",
        transaction_ref,
        callback_url: callback_url || "https://lootboxx.live/deposit",
        payment_channels: ["card", "bank", "ussd", "transfer"],
        customer_name: email.split("@")[0],
        metadata: {
          user_id: userId,
          deposit_type,
          bonus: Number(bonus || 0),
          points_reward: Number(points_reward || 0),
        },
      }),
    });

    const data = await initRes.json();
    if (!initRes.ok || data.status !== 200) {
      console.error("Squad init failed:", data);
      return json({ error: data.message || "Failed to initialize", details: data }, 400);
    }

    return json({
      success: true,
      checkout_url: data.data.checkout_url,
      transaction_ref: data.data.transaction_ref,
    });
  } catch (err: any) {
    console.error("squad-initialize error:", err);
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
