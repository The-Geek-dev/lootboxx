import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const BRAVE_SEARCH_API_KEY = Deno.env.get("BRAVE_SEARCH_API_KEY");

interface DraftMarket {
  question: string;
  description: string;
  category: string;
  hours_until_deadline: number;
}

interface NewsSnippet {
  title: string;
  description: string;
  url: string;
}

// --- News fetchers -----------------------------------------------------------

async function braveNews(query: string, count = 8): Promise<NewsSnippet[]> {
  if (!BRAVE_SEARCH_API_KEY) return [];
  try {
    const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${count}&freshness=pd`;
    const res = await fetch(url, {
      headers: { "X-Subscription-Token": BRAVE_SEARCH_API_KEY, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.results ?? []).slice(0, count).map((r: any) => ({
      title: r.title ?? "",
      description: r.description ?? "",
      url: r.url ?? "",
    }));
  } catch (e) {
    console.warn("brave news failed", e);
    return [];
  }
}

async function firecrawlSearch(query: string, limit = 8): Promise<NewsSnippet[]> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, tbs: "qdr:d" }),
    });
    if (!res.ok) return [];
    const j = await res.json();
    const items = j.data ?? j.web ?? [];
    return items.slice(0, limit).map((r: any) => ({
      title: r.title ?? "",
      description: r.description ?? r.snippet ?? "",
      url: r.url ?? "",
    }));
  } catch (e) {
    console.warn("firecrawl search failed", e);
    return [];
  }
}

async function fetchFreshNews(region: "nigeria" | "global"): Promise<NewsSnippet[]> {
  const queries =
    region === "nigeria"
      ? [
          "Nigeria news today politics economy",
          "Super Eagles NPFL football today",
          "Naira CBN fuel price Nigeria today",
          "Nollywood Afrobeats Nigeria today",
        ]
      : [
          "world news today politics",
          "Premier League Champions League today",
          "Bitcoin S&P 500 markets today",
          "tech news OpenAI Apple Tesla today",
        ];

  const all: NewsSnippet[] = [];
  for (const q of queries) {
    const [b, f] = await Promise.all([braveNews(q, 5), firecrawlSearch(q, 5)]);
    all.push(...b, ...f);
  }
  // Deduplicate by URL/title
  const seen = new Set<string>();
  return all.filter((n) => {
    const key = n.url || n.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- AI generation -----------------------------------------------------------

async function generateMarkets(
  region: "nigeria" | "global",
  count: number,
  news: NewsSnippet[],
): Promise<DraftMarket[]> {
  const focus =
    region === "nigeria"
      ? "current Nigerian politics, economy (Naira, fuel, CBN), Super Eagles & NPFL football, Nollywood/Afrobeats, Lagos/Abuja news, EPL Nigerian players"
      : "world politics, US/EU/Asia news, global markets (BTC, oil, S&P), Champions League/Premier League, tech (OpenAI, Apple, Tesla), major sports & celebrity events";

  const newsContext =
    news.length > 0
      ? `\n\nRECENT NEWS HEADLINES (use these as the basis — do NOT invent events):\n${news
          .slice(0, 25)
          .map((n, i) => `${i + 1}. ${n.title} — ${n.description}`)
          .join("\n")}\n`
      : "";

  const prompt = `Generate ${count} short, binary YES/NO prediction-market questions about REAL upcoming ${region === "nigeria" ? "Nigerian" : "global"} events likely to be resolved within 12-72 hours.
Focus areas: ${focus}.${newsContext}
Each question must have a clear, verifiable outcome (e.g. "Will X happen by Y date?", "Will team A beat team B tonight?").
Avoid evergreen or vague questions. Avoid duplicates. Today is ${new Date().toISOString().slice(0, 10)}.

Return ONLY a JSON array, no markdown, with objects: { "question": string, "description": string (1 sentence context), "category": string (e.g. "Politics", "Sports", "Crypto", "Economy", "Entertainment"), "hours_until_deadline": number (12-72) }`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You output ONLY valid JSON arrays. No prose, no markdown fences." },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway ${res.status}: ${t}`);
  }
  const j = await res.json();
  let text: string = j.choices?.[0]?.message?.content ?? "[]";
  text = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  try {
    return JSON.parse(text) as DraftMarket[];
  } catch {
    return [];
  }
}

// --- Edge function -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const regions: ("nigeria" | "global")[] = ["nigeria", "global"];
    const tiers: { tier: "regular" | "vip"; currency: "points" | "cash" }[] = [
      { tier: "regular", currency: "points" },
      { tier: "vip", currency: "cash" },
    ];

    let inserted = 0;
    const sources = {
      brave: !!BRAVE_SEARCH_API_KEY,
      firecrawl: !!FIRECRAWL_API_KEY,
    };

    for (const region of regions) {
      const news = await fetchFreshNews(region);
      console.log(`[${region}] fetched ${news.length} news snippets (brave=${sources.brave}, firecrawl=${sources.firecrawl})`);
      const drafts = await generateMarkets(region, 6, news);
      for (const t of tiers) {
        for (const d of drafts.slice(0, 5)) {
          const hours = Math.max(12, Math.min(72, d.hours_until_deadline ?? 24));
          const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
          const sourceUrls = news.slice(0, 3).map((n) => n.url).filter(Boolean);
          const { error } = await supabase.from("prediction_markets").insert({
            region,
            tier: t.tier,
            currency: t.currency,
            question: d.question,
            description: d.description ?? null,
            category: d.category ?? "General",
            deadline,
            source_urls: sourceUrls,
          });
          if (!error) inserted++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, inserted, sources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predictions-generator error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
