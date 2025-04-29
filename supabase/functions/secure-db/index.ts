
// Edge Function: secure-db
// Generic database proxy for Supabase that masks errors and URLs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

// Create an admin Supabase client with service role key
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

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract the table name from the URL path
    // Expected format: /table_name or /table_name/id
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 1) {
      return new Response(
        JSON.stringify({ error: 'INVALID_PATH' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const tableName = pathParts[0];
    const id = pathParts.length > 1 ? pathParts[1] : null;
    
    // Create a Supabase client with the user's JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    // Parse request body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      body = await req.json();
    }
    
    let response;
    
    // Development-only logging
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.debug(`DB Request: ${req.method} ${tableName}${id ? '/' + id : ''}`);
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        if (id) {
          // Get a specific record by ID
          response = await supabaseClient.from(tableName).select().eq('id', id).single();
        } else {
          // Get all records, respecting query params
          const searchParams = new URLSearchParams(url.search);
          let query = supabaseClient.from(tableName).select();
          
          // Apply filters from query parameters
          for (const [key, value] of searchParams.entries()) {
            if (key === 'select') {
              query = query.select(value);
            } else if (key === 'order') {
              const [column, direction] = value.split('.');
              query = query.order(column, { ascending: direction === 'asc' });
            } else if (key === 'limit') {
              query = query.limit(parseInt(value));
            } else if (key !== 'select' && key !== 'order' && key !== 'limit') {
              query = query.eq(key, value);
            }
          }
          
          response = await query;
        }
        break;
        
      case 'POST':
        response = await supabaseClient.from(tableName).insert(body).select();
        break;
        
      case 'PATCH':
      case 'PUT':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID_REQUIRED' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        response = await supabaseClient.from(tableName).update(body).eq('id', id).select();
        break;
        
      case 'DELETE':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID_REQUIRED' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        response = await supabaseClient.from(tableName).delete().eq('id', id);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Handle Supabase errors without exposing details
    if (response.error) {
      if (Deno.env.get("ENVIRONMENT") === "development") {
        console.error("DB error:", sanitizeErrorMessage(JSON.stringify(response.error)));
      }
      
      // Map error status codes appropriately
      let status = 400;
      if (response.error.code === "PGRST116") status = 404;
      if (response.error.code === "42P01") status = 404; // Table not found
      if (response.error.code === "42501") status = 403; // Permission denied
      
      return new Response(
        JSON.stringify({ error: 'REQUEST_FAILED' }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Return successful response
    return new Response(
      JSON.stringify(response.data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // Handle unexpected errors
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.error("Unexpected error:", sanitizeErrorMessage(err.message));
    }
    
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
