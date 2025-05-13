
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// Create a Supabase client with the auth context of the function
export const createServerClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables in Edge Function');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Standard CORS headers for Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to handle OPTIONS requests
export const handleCorsOptions = () => {
  return new Response(null, { headers: corsHeaders });
};
