
// Description: Get public configuration for the application
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Enable CORS
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  });

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers,
      status: 204,
    });
  }

  try {
    // Return public config (env variables marked as public)
    const config = {
      version: "1.0.0",
      buildDate: new Date().toISOString(),
      environment: Deno.env.get("ENVIRONMENT") || "development",
      features: {
        registration: true,
        oauth: false,
        passwordReset: true,
      },
    };

    return new Response(JSON.stringify(config), {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to get public config" }),
      {
        headers,
        status: 500,
      }
    );
  }
});
