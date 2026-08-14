// Shared CORS helper: restricts allowed origins to production + Lovable previews.
const ALLOWED_ORIGINS = [
  "https://lootboxx.live",
  "https://www.lootboxx.live",
  "https://lootboxx.lovable.app",
];

const PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i;

export function buildCors(req: Request, extraHeaders = ""): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) || PREVIEW_RE.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type" + (extraHeaders ? ", " + extraHeaders : ""),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
