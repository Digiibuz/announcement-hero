
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a simple direct Supabase client with no extra complexity
const supabaseUrl = 'https://rdwqedmvzicerwotjseg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
