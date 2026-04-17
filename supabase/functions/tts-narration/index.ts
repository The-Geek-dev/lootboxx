// Temporary helper to generate ElevenLabs voiceover MP3s
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text, voiceId = "JBFqnCBsd6RMkjVDRZzb", speed = 1.05 } = await req.json();
    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) throw new Error("Missing ELEVENLABS_API_KEY");
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed },
        }),
      }
    );
    if (!r.ok) {
      const err = await r.text();
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = await r.arrayBuffer();
    return new Response(buf, { headers: { ...corsHeaders, "Content-Type": "audio/mpeg" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
