
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * This module provides utility functions for creating a Supabase client
 * with service role permissions.
 * 
 * IMPORTANT: This file should only be imported in Supabase Edge Functions.
 * It uses Deno APIs which are only available in the Edge Function environment.
 * Do not import this file in client-side code.
 */

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
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};

// For TypeScript type checking only - will be removed during build
// This allows the file to be imported without runtime errors
if (typeof window !== 'undefined') {
  console.warn(
    'Warning: serverClient.ts should only be imported in Edge Functions. ' +
    'This code is running in a browser environment.'
  );
}
