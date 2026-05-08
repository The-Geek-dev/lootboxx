import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function decideOutcome(question: string, description: string | null): Promise<{ outcome: "yes" | "no" | "void"; notes: string }> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You resolve binary prediction markets. Reply ONLY with JSON: {\"outcome\":\"yes|no|void\",\"notes\":\"brief reason\"}. Use 'void' if you cannot determine the outcome.",
        },
        {
          role: "user",
          content: `Question: ${question}\nContext: ${description ?? ""}\nToday: ${new Date().toISOString().slice(0, 10)}\nDecide YES, NO, or VOID.`,
        },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) return { outcome: "void", notes: "ai_error" };
  const j = await res.json();
  let txt: string = j.choices?.[0]?.message?.content ?? "{}";
  txt = txt.replace(/```(?:json)?/gi, "").trim();
  try {
    const parsed = JSON.parse(txt);
    const o = String(parsed.outcome ?? "void").toLowerCase();
    return {
      outcome: ["yes", "no", "void"].includes(o) ? (o as "yes" | "no" | "void") : "void",
      notes: String(parsed.notes ?? "").slice(0, 500),
    };
  } catch {
    return { outcome: "void", notes: "parse_error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: due } = await supabase
      .from("prediction_markets")
      .select("id, question, description")
      .eq("resolved", false)
      .lt("deadline", new Date().toISOString())
      .limit(50);

    const results: any[] = [];
    for (const m of due ?? []) {
      const { outcome, notes } = await decideOutcome(m.question, m.description);
      const { data, error } = await supabase.rpc("resolve_prediction_market", {
        p_market_id: m.id,
        p_outcome: outcome,
        p_notes: notes,
      });
      results.push({ id: m.id, outcome, notes, ok: !error, data, error: error?.message });
    }

    return new Response(JSON.stringify({ success: true, resolved: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predictions-resolver error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
