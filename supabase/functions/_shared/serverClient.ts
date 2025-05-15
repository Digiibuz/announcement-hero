
import { createClient } from '@supabase/supabase-js';

/**
 * This module provides utility functions for creating a Supabase client
 * with service role permissions.
 * 
 * IMPORTANT: This file should only be imported in Supabase Edge Functions.
 * It uses Deno APIs which are only available in the Edge Function environment.
 */

// TypeScript declaration for Deno global
declare global {
  interface DenoNamespace {
    env: {
      get(key: string): string | undefined;
    }
  }
  
  const Deno: DenoNamespace | undefined;
}

// This function should only be called within Edge Functions
export const createServerSupabaseClient = () => {
  // Check if running in Deno environment
  if (typeof Deno === 'undefined') {
    throw new Error(
      'createServerSupabaseClient can only be used in Supabase Edge Functions. ' +
      'This error indicates the function was imported in a client-side context.'
    );
  }

  // Get environment variables from Deno environment
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables in Edge Function');
  }
  
  // Create a client with the service role key for admin operations
  return createClient(supabaseUrl, supabaseServiceKey);
};
