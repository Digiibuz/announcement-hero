
// Ce fichier est généré automatiquement. Ne pas le modifier directement.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { obfuscateKey, deobfuscateKey, secureStore, secureRetrieve, SecureKeysConfig } from '@/utils/secureKeys';

// Valeurs obfusquées pour le build
const OBFUSCATED_SUPABASE_URL = "68747470733a2f2f7264777165646d767a6963657277746f746a7365672e737570616261736520636f";
const OBFUSCATED_SUPABASE_KEY = "65794a68624763694f694a49557a49314e694973496e5235634349364a6b5a45516b51694c434a796232786c496a6f69595735766269736961575934496a6f784e7a517a4d4463344f444d784c434a6c654849694f6a49774e5467324e5451344d7a46392e4f686c655f7656766465436e73624f62503941744164794d3532586e4f7a6973487648764631443161383878";

// Fonction pour obtenir l'URL Supabase en priorité depuis le stockage sécurisé,
// sinon désobfusquer la valeur par défaut
function getSupabaseUrl(): string {
  // Tente d'abord de récupérer depuis le stockage sécurisé (par exemple après login)
  const storedUrl = secureRetrieve(SecureKeysConfig.KEY_NAMES.SUPABASE_URL);
  if (storedUrl) return storedUrl;
  
  // Sinon utilise la valeur par défaut désobfusquée
  return deobfuscateKey(OBFUSCATED_SUPABASE_URL);
}

// Fonction pour obtenir la clé Supabase en priorité depuis le stockage sécurisé,
// sinon désobfusquer la valeur par défaut
function getSupabaseKey(): string {
  // Tente d'abord de récupérer depuis le stockage sécurisé (par exemple après login)
  const storedKey = secureRetrieve(SecureKeysConfig.KEY_NAMES.SUPABASE_KEY);
  if (storedKey) return storedKey;
  
  // Sinon utilise la valeur par défaut désobfusquée
  return deobfuscateKey(OBFUSCATED_SUPABASE_KEY);
}

// Import client Supabase comme ceci:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(getSupabaseUrl(), getSupabaseKey(), {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Activer la détection de session dans l'URL
    storage: localStorage, // Utiliser localStorage pour une meilleure persistance
    flowType: 'pkce' // Utiliser PKCE pour une meilleure sécurité
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Expose une fonction pour mettre à jour les informations d'authentification si nécessaire
export function updateSupabaseCredentials(url: string, key: string): void {
  if (url) secureStore(SecureKeysConfig.KEY_NAMES.SUPABASE_URL, url);
  if (key) secureStore(SecureKeysConfig.KEY_NAMES.SUPABASE_KEY, key);
}

// Fonction d'aide pour vérifier la connexion à Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Try to query an existing table instead of test_connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    return !error;
  } catch (error) {
    console.error('Erreur de connexion à Supabase:', error);
    return false;
  }
}
