// AI auto-reply for live chat. Triggered after a user message is inserted.
// - Skips if conversation has ai_paused = true (admin took over).
// - Streams a reply from Lovable AI and inserts it as an 'ai' message.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are LootBoxx Support, a friendly Nigerian gaming platform assistant. 
Be warm, concise, and helpful. Use simple English, occasional Naija touch is welcome but stay professional.

About LootBoxx:
- Gaming rewards platform with raffles, spin-the-wheel, trivia, slots, mines, crash, plinko, baccarat and more.
- Activation: ₦7,000 one-time. Weekly renewal: ₦2,000.
- Withdrawals: weekends only, 5–7PM WAT, 5% processing fee.
- Min withdrawal info is in the dashboard.
- Payments via Flutterwave. After paying, access activates within seconds (we have realtime + 60s polling fallback).
- Referral bonuses paid when invitee deposits.
- Email: lootboxxsupport@gmail.com

Rules:
- If a question needs human action (refund, account ban, payment dispute, KYC), say a human admin will reply shortly.
- Never invent payout numbers — direct to the FAQ page if unsure.
- Keep replies under 4 sentences unless explaining a process.
- Never ask for passwords, OTPs, card details, or full bank info.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) {
      return new Response(JSON.stringify({ error: "conversation_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load conversation
    const { data: conv, error: convErr } = await supabase
      .from("chat_conversations")
      .select("id, ai_paused, status")
      .eq("id", conversation_id)
      .maybeSingle();

    if (convErr || !conv) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conv.ai_paused || conv.status === "closed") {
      return new Response(JSON.stringify({ skipped: true, reason: "ai_paused_or_closed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load last 20 messages for context
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("sender_role, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const history = (msgs ?? []).map((m: any) => ({
      role: m.sender_role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Need at least one user message
    if (!history.some((m) => m.role === "user")) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_user_message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const replyText: string =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Thanks for reaching out! A human agent will be with you shortly.";

    // Insert AI message
    const { error: insertErr } = await supabase.from("chat_messages").insert({
      conversation_id,
      sender_role: "ai",
      content: replyText,
    });
    if (insertErr) throw insertErr;

    // Update conversation preview + bump admin unread (so admin sees activity)
    await supabase
      .from("chat_conversations")
      .update({
        last_message_preview: replyText.slice(0, 140),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation_id);

    return new Response(JSON.stringify({ ok: true, reply: replyText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai-reply error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
