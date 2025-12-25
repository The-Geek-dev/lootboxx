import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateKeyRequest {
  name: string;
  permissions: string[];
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

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Invalid authentication");
    }

    const { name, permissions }: GenerateKeyRequest = await req.json();

    if (!name) {
      throw new Error("API key name is required");
    }

    // Generate a secure random API key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const apiKey = "sq_" + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Create hash of the key for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Store the key (only hash, never the actual key)
    const { error: insertError } = await supabaseAdmin
      .from("api_keys")
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: apiKey.substring(0, 12),
        permissions: permissions || ["read"],
      });

    if (insertError) {
      console.error("Error storing API key:", insertError);
      throw new Error("Failed to create API key");
    }

    console.log("API key generated for user:", user.id);

    // Return the full key ONLY ONCE - it can never be retrieved again
    return new Response(
      JSON.stringify({ 
        success: true, 
        api_key: apiKey,
        message: "Save this key now - it will not be shown again!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-api-key function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
