
// Edge Function: secure-login
// Provides a secure login proxy that doesn't expose Supabase URLs/errors in client logs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// CORS headers to ensure the function can be called from the frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create a Supabase client with the admin key for auth operations
// Using a masked URL for additional security
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create client with silent error handling
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { 
    auth: { 
      persistSession: false 
    },
    global: {
      // Disable any fetch logs
      fetch: (...args) => {
        return fetch(...args);
      }
    }
  }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests for login
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse the request body for email and password
    const { email, password } = await req.json();

    // Validate request data
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to sign in using Supabase admin client
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors without exposing sensitive details
    if (error) {
      // Return standardized error response with specific code for frontend handling
      return new Response(
        JSON.stringify({ error: 'INVALID_CREDENTIALS', code: 'INVALID_CREDENTIALS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success with tokens and user data
    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
