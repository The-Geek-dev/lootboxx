// Sends Web Push to all subscriptions of a user (or list of users).
// Triggered by a DB webhook on `notifications` INSERT, or invoked manually.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@lootboxx.live";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    // Accept either:
    // a) Webhook payload from `notifications` INSERT: { record: { user_id, title, message, type } }
    // b) Manual: { user_id?, user_ids?, title, body, url? }
    let userIds: string[] = [];
    let title = "LootBoxx";
    let messageBody = "";
    let url = "/dashboard";

    if (body.record) {
      userIds = [body.record.user_id];
      title = body.record.title || title;
      messageBody = body.record.message || "";
      const type = body.record.type;
      if (type === "deposit") url = "/dashboard";
      else if (type === "referral") url = "/referrals";
      else if (type === "withdrawal") url = "/withdraw";
      else if (type === "streak" || type === "bonus") url = "/games";
    } else {
      if (body.user_id) userIds = [body.user_id];
      if (Array.isArray(body.user_ids)) userIds = body.user_ids;
      title = body.title || title;
      messageBody = body.body || body.message || "";
      url = body.url || url;
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: messageBody, url });
    let sent = 0;
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (e: any) {
          const status = e?.statusCode;
          if (status === 404 || status === 410) expired.push(s.endpoint);
          console.error("push send failed", status, e?.body || e?.message);
        }
      }),
    );

    if (expired.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    return new Response(JSON.stringify({ sent, expired: expired.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
