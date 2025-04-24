
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// This client should only be used in server-side contexts
// like Edge Functions, and never exposed to the client

// For Edge Functions, we rely on environment variables set in Supabase
export const createServerSupabaseClient = () => {
  // These variables are set in the Supabase Edge Functions environment
  // and are never exposed to the client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables in Edge Function');
  }
  
  // Create a client with the service role key for admin operations
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};
