
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

// Function to prevent browser caching
const generateCacheKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Function to get client IP and user agent
const getClientInfo = (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") || 
             req.headers.get("cf-connecting-ip") || 
             "unknown";
  
  const ua = req.headers.get("user-agent") || "unknown";
  
  return {
    ip: ip.split(',')[0].trim(), // Get first IP if multiple are in the chain
    userAgent: ua
  };
};

const handler = async (req: Request) => {
  const requestTime = new Date().toISOString();
  const requestId = crypto.randomUUID();
  
  // CORS preflight handling with all necessary headers
  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] OPTIONS request received at ${requestTime}, responding with CORS headers`);
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
    const clientDetails = getClientInfo(req);
    
    console.log(`[${requestId}] Request received at ${requestTime}`);
    console.log(`[${requestId}] Origin: ${origin} (attempt: ${retryAttempt}, client: ${clientId})`);
    console.log(`[${requestId}] IP: ${clientDetails.ip}, User-Agent: ${clientDetails.userAgent.substring(0, 50)}...`);
    console.log(`[${requestId}] Client info: ${clientInfo}`);
    console.log(`[${requestId}] Headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
    
    // Check if this is a test request
    const isTestMode = new URL(req.url).searchParams.get("testMode") === "true";
    if (isTestMode) {
      console.log(`[${requestId}] Test mode request detected`);
    }
    
    // Get API key from environment variables
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!anonKey) {
      console.error(`[${requestId}] ERROR: API key not defined in environment variables`);
      return prepareResponse({ 
        error: "Server configuration missing", 
        details: "Supabase API key is not defined in environment variables",
        requestId,
        origin,
        timestamp: requestTime,
        success: false,
        cacheKey: generateCacheKey()
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
        timestamp: requestTime,
        success: false,
        cacheKey: generateCacheKey()
      }, 500);
    }

    console.log(`[${requestId}] Successfully retrieved Supabase API key and URL`);
    
    // For test mode, return more diagnostic info but mask the key
    if (isTestMode) {
      console.log(`[${requestId}] Returning test mode response with masked key`);
      return prepareResponse({
        message: "Test connection successful",
        url,
        keyLength: anonKey.length,
        keyPrefix: anonKey.substring(0, 5) + "...",
        keySuffix: "..." + anonKey.substring(anonKey.length - 5),
        timestamp: requestTime,
        origin,
        clientInfo,
        clientId,
        requestId,
        headers: Object.fromEntries(req.headers.entries()),
        success: true,
        cacheKey: generateCacheKey()
      });
    }
    
    // Return a robust response with diagnostic info
    return prepareResponse({
      anonKey,
      url,
      timestamp: requestTime,
      origin,
      clientInfo,
      clientId,
      requestId,
      success: true,
      cacheKey: generateCacheKey()
    });
  } catch (error: any) {
    console.error(`[${requestId}] Critical error while processing request at ${requestTime}:`, error);
    return prepareResponse({ 
      error: "Server error", 
      details: error.message || "An unknown error occurred",
      timestamp: requestTime,
      requestId,
      stack: error.stack,
      success: false,
      cacheKey: generateCacheKey()
    }, 500);
  }
};

// Define the HTTP request handler
serve(handler);
