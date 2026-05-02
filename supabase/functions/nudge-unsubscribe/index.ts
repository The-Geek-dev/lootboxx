// Public endpoint hit from email "unsubscribe" links.
// Toggles nudge_emails_enabled to false for the user matching the token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const html = (title: string, body: string) =>
    `<!doctype html><html><body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <div style="max-width:480px;padding:40px;background:rgba(255,255,255,0.05);border:1px solid rgba(94,231,223,0.2);border-radius:16px;text-align:center;">
        <h1 style="margin:0 0 16px;color:#5EE7DF;">${title}</h1>
        <p style="margin:0 0 24px;line-height:1.6;color:#cbd5e1;">${body}</p>
        <a href="https://lootboxx.live/settings" style="display:inline-block;background:#5EE7DF;color:#0F172A;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Manage Preferences</a>
      </div>
    </body></html>`;

  if (!token) {
    return new Response(html("Invalid Link", "This unsubscribe link is missing a token."), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("email_preferences")
    .update({ nudge_emails_enabled: false, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("user_id")
    .maybeSingle();

  if (error || !data) {
    return new Response(html("Link Expired", "We couldn't find a matching account for that link."), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  return new Response(
    html("You're unsubscribed", "You won't receive nudge emails from LootBoxx anymore. You can re-enable them anytime from your settings."),
    { headers: { ...corsHeaders, "Content-Type": "text/html" } },
  );
});
