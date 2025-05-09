
// Supabase Edge Function: secure-client-config
// Cette fonction fournit de manière sécurisée la clé anonyme pour le client Supabase

import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Wrap the response preparation for better error handling
const prepareResponse = (body: any, status = 200) => {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    }
  );
};

const handler = async (req: Request) => {
  // CORS preflight handling with all necessary headers
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request received, responding with CORS headers");
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      }
    });
  }

  try {
    const origin = req.headers.get("origin") || "unknown origin";
    const retryAttempt = req.headers.get("x-retry-attempt") || "0";
    const clientInfo = req.headers.get("x-client-info") || "unknown client info";
    const clientId = req.headers.get("x-client-id") || "unknown";
    const requestId = crypto.randomUUID();
    
    console.log(`[${requestId}] Request received from: ${origin} (attempt: ${retryAttempt}, client: ${clientId})`);
    console.log(`[${requestId}] Client info: ${clientInfo}`);
    console.log(`[${requestId}] Headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
    
    // Get API key from environment variables
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!anonKey) {
      console.error(`[${requestId}] ERROR: API key not defined in environment variables`);
      return prepareResponse({ 
        error: "Server configuration missing", 
        details: "Supabase API key is not defined in environment variables",
        requestId,
        origin,
        timestamp: new Date().toISOString(),
        success: false
      }, 500);
    }

    // Additional checks
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) {
      console.error(`[${requestId}] ERROR: Supabase URL not defined`);
      return prepareResponse({ 
        error: "Incomplete server configuration", 
        details: "Supabase URL is not defined",
        requestId,
        origin,
        timestamp: new Date().toISOString(),
        success: false
      }, 500);
    }

    console.log(`[${requestId}] Successfully retrieved Supabase API key and URL`);
    
    // Return a robust response with diagnostic info
    return prepareResponse({
      anonKey,
      url,
      timestamp: new Date().toISOString(),
      origin,
      clientInfo,
      clientId,
      requestId,
      success: true
    });
  } catch (error: any) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Critical error while processing request:`, error);
    return prepareResponse({ 
      error: "Server error", 
      details: error.message || "An unknown error occurred",
      timestamp: new Date().toISOString(),
      requestId,
      stack: error.stack,
      success: false
    }, 500);
  }
};

// Define the HTTP request handler
serve(handler);
