import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to convert Uint8Array to base64
const toBase64 = (arr: Uint8Array): string => {
  return btoa(String.fromCharCode(...arr));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with user's token to get user info
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Generate Curve25519 keypair (WireGuard compatible)
    const keyPair = nacl.box.keyPair();
    const publicKey = toBase64(keyPair.publicKey);
    const privateKey = toBase64(keyPair.secretKey);

    // For now, we'll store the private key "encrypted" with a simple encoding
    // In production, this should use proper encryption with a user-derived key
    const privateKeyEncrypted = btoa(privateKey);

    // Use service role to insert into protected table
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: setupError } = await supabaseAdmin.rpc("setup_new_user", {
      _user_id: user.id,
      _public_key: publicKey,
      _private_key_encrypted: privateKeyEncrypted,
    });

    if (setupError) {
      console.error("Setup error:", setupError);
      throw new Error("Failed to setup user");
    }

    console.log(`Generated keypair for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        public_key: publicKey,
        // Return private key to user once - they should save it
        private_key: privateKey,
        message: "Save your private key securely. It cannot be recovered.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating keypair:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
