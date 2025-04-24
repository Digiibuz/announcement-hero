
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// This client should only be used in server-side contexts
// like Edge Functions, and never exposed to the client

// In a real server environment, these would be process.env variables
// For Vite-based apps using Edge Functions, we use import.meta.env
export const createServerSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};
