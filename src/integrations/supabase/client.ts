
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { decrypt, isEncrypted } from '@/utils/crypto';

// Valeurs potentiellement cryptées (si en production)
let SUPABASE_URL = "https://rdwqedmvzicerwotjseg.supabase.co";
let SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk";

// Décrypter si les valeurs sont cryptées (en production)
if (isEncrypted(SUPABASE_URL)) {
  SUPABASE_URL = decrypt(SUPABASE_URL);
}

if (isEncrypted(SUPABASE_PUBLISHABLE_KEY)) {
  SUPABASE_PUBLISHABLE_KEY = decrypt(SUPABASE_PUBLISHABLE_KEY);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
