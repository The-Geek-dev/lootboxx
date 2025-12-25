import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, user_id }: SendOTPRequest = await req.json();

    if (!email || !user_id) {
      throw new Error("Email and user_id are required");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this user
    await supabaseAdmin
      .from("otp_codes")
      .update({ used: true })
      .eq("user_id", user_id)
      .eq("used", false);

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from("otp_codes")
      .insert({
        user_id,
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    // Send OTP email
    const { error: emailError } = await resend.emails.send({
      from: "SQUANCH Security <onboarding@resend.dev>",
      to: [email],
      subject: "Your SQUANCH Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px; }
            .container { max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; padding: 40px; }
            .logo { text-align: center; margin-bottom: 30px; }
            .code { font-size: 48px; font-weight: bold; text-align: center; letter-spacing: 8px; color: #8B5CF6; padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; margin: 20px 0; }
            .text { color: #a0a0a0; text-align: center; line-height: 1.6; }
            .warning { color: #ff6b6b; font-size: 12px; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1 style="color: #8B5CF6;">SQUANCH</h1>
            </div>
            <p class="text">Your verification code is:</p>
            <div class="code">${otp}</div>
            <p class="text">This code will expire in 10 minutes.</p>
            <p class="warning">If you didn't request this code, please ignore this email or contact support.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Failed to send verification email");
    }

    console.log("OTP sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
