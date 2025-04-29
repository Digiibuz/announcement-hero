
// Edge Function: secure-refresh
// Refreshes authentication tokens without exposing Supabase URLs/errors in client logs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create Supabase admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  { auth: { persistSession: false } }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for token refresh
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse the request body for refresh token
    const { refresh_token } = await req.json();

    // Validate request data
    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Development-only logging
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.debug(`Token refresh attempt`);
    }

    // Attempt to refresh the token
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token
    });

    // Handle refresh errors without exposing sensitive details
    if (error) {
      if (Deno.env.get("ENVIRONMENT") === "development") {
        console.debug(`Refresh error type: ${error.status}`);
      }
      
      return new Response(
        JSON.stringify({ error: 'INVALID_REFRESH_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the new tokens
    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // Handle unexpected errors
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.error("Refresh error:", sanitizeErrorMessage(err.message));
    }
    
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
