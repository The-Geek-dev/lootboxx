import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KUDA_ACCOUNT = "3003749879";
const KUDA_NAME_TOKENS = ["LOOTBOXX", "VENTURES"]; // match either is good signal

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      console.error("Auth failed:", userErr);
      return json({ error: "Unauthorized", details: userErr?.message }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { receipt_id } = body ?? {};
    if (!receipt_id) return json({ error: "receipt_id required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch the receipt
    const { data: receipt, error: rErr } = await admin
      .from("deposit_receipts")
      .select("*")
      .eq("id", receipt_id)
      .eq("user_id", userId)
      .single();

    if (rErr || !receipt) return json({ error: "Receipt not found" }, 404);
    if (receipt.status === "verified") {
      return json({ success: true, message: "Already verified", status: "verified" });
    }

    // Generate a signed URL for the AI to fetch the image
    const { data: signed, error: sErr } = await admin.storage
      .from("receipts")
      .createSignedUrl(receipt.receipt_url, 300);
    if (sErr || !signed?.signedUrl) {
      return json({ error: "Failed to access receipt image" }, 500);
    }

    // Fetch image and convert to base64 for AI
    const imgRes = await fetch(signed.signedUrl);
    if (!imgRes.ok) return json({ error: "Receipt image unavailable" }, 500);
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Call Lovable AI with vision
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a strict bank-transfer receipt verifier. Extract fields from the receipt image and return JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Extract the following from this Nigerian bank transfer receipt and respond with ONLY a JSON object (no markdown, no prose):\n` +
                  `{\n` +
                  `  "amount": number (the naira amount transferred, no currency symbol),\n` +
                  `  "recipient_account": string (the recipient/beneficiary account number),\n` +
                  `  "recipient_name": string (the recipient/beneficiary account name, uppercase),\n` +
                  `  "recipient_bank": string (recipient bank name if visible),\n` +
                  `  "status": string (e.g. "Successful", "Failed", or whatever the receipt shows),\n` +
                  `  "is_receipt": boolean (true if this looks like a real bank/fintech transfer receipt)\n` +
                  `}`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      await admin
        .from("deposit_receipts")
        .update({ status: "manual_review", ai_notes: `AI error: ${aiRes.status}` })
        .eq("id", receipt.id);
      return json({
        success: false,
        status: "manual_review",
        message: "Could not auto-verify. An admin will review your receipt shortly.",
      });
    }

    const aiData = await aiRes.json();
    const content: string = aiData?.choices?.[0]?.message?.content ?? "";
    const parsed = parseJsonLoose(content);

    if (!parsed) {
      await admin
        .from("deposit_receipts")
        .update({ status: "manual_review", ai_notes: "Could not parse AI response" })
        .eq("id", receipt.id);
      return json({
        success: false,
        status: "manual_review",
        message: "We couldn't read the receipt automatically. An admin will review it.",
      });
    }

    const extractedAmount = Number(parsed.amount ?? 0);
    const extractedAccount = String(parsed.recipient_account ?? "").replace(/\D/g, "");
    const extractedName = String(parsed.recipient_name ?? "").toUpperCase();
    const isReceipt = parsed.is_receipt !== false;
    const status = String(parsed.status ?? "").toLowerCase();

    // Validate
    const errors: string[] = [];
    if (!isReceipt) errors.push("Image does not look like a transfer receipt.");
    if (status && status.includes("fail")) errors.push("Receipt shows a failed transfer.");
    if (extractedAccount !== KUDA_ACCOUNT) {
      errors.push(`Recipient account mismatch (got ${extractedAccount || "?"}, expected ${KUDA_ACCOUNT}).`);
    }
    const nameOk = KUDA_NAME_TOKENS.some((t) => extractedName.includes(t));
    if (!nameOk) {
      errors.push(`Recipient name does not match LOOTBOXX VENTURES (got "${extractedName || "?"}").`);
    }
    if (Math.abs(extractedAmount - Number(receipt.amount)) > 1) {
      errors.push(`Amount mismatch (paid ₦${extractedAmount}, expected ₦${receipt.amount}).`);
    }

    if (errors.length > 0) {
      await admin
        .from("deposit_receipts")
        .update({
          status: "rejected",
          ai_notes: JSON.stringify(parsed),
          extracted_amount: extractedAmount || null,
          extracted_account: extractedAccount || null,
          extracted_recipient: extractedName || null,
          rejection_reason: errors.join(" "),
        })
        .eq("id", receipt.id);

      return json({
        success: false,
        status: "rejected",
        message: errors.join(" "),
        extracted: parsed,
      });
    }

    // Credit wallet via RPC
    const { data: creditResult, error: creditErr } = await admin.rpc("credit_verified_deposit", {
      p_user_id: userId,
      p_amount: receipt.amount,
      p_bonus: receipt.bonus,
      p_points: receipt.points_reward,
      p_deposit_type: receipt.deposit_type,
    });

    if (creditErr) {
      console.error("Credit error:", creditErr);
      await admin
        .from("deposit_receipts")
        .update({ status: "manual_review", ai_notes: `Credit failed: ${creditErr.message}` })
        .eq("id", receipt.id);
      return json({
        success: false,
        status: "manual_review",
        message: "Verified but crediting failed. Admin will assist.",
      });
    }

    await admin
      .from("deposit_receipts")
      .update({
        status: "verified",
        ai_notes: JSON.stringify(parsed),
        extracted_amount: extractedAmount,
        extracted_account: extractedAccount,
        extracted_recipient: extractedName,
      })
      .eq("id", receipt.id);

    return json({
      success: true,
      status: "verified",
      message: "Payment verified! Wallet credited.",
      credit: creditResult,
    });
  } catch (err: any) {
    console.error("verify-receipt error:", err);
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any);
  }
  return btoa(binary);
}

function parseJsonLoose(text: string): any | null {
  if (!text) return null;
  // Strip code fences
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find first { ... } block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    return null;
  }
}
