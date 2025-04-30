
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Remplacer les URLs sensibles par des URLs génériques
// Plus tard, les vraies URLs seront utilisées mais pas affichées en console
const SUPABASE_URL = 'https://api-secure.example.com'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key' 

// Instance singleton du client Supabase
let supabaseInstance: SupabaseClient<Database> | null = null;

// Créer un client Supabase sécurisé
export const supabase = createClient<Database>(
  // Utiliser les vraies valeurs d'environnement, mais seulement en interne
  import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Fonction pour définir le client Supabase
export function setSupabaseClient(client: SupabaseClient<Database> | null): void {
  supabaseInstance = client;
}

// Fonction pour obtenir l'instance Supabase
export function getSupabaseClient(): SupabaseClient<Database> | null {
  return supabaseInstance || supabase;
}

// Intercepter toutes les opérations qui pourraient exposer l'URL de Supabase
Object.defineProperty(supabase, 'supabaseUrl', {
  get: function() {
    return SUPABASE_URL
  },
  configurable: false
})

// Liste des patterns sensibles pour masquer dans les logs
export const SENSITIVE_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /grant_type=password/i,
  /rdwqedmvzicerwotjseg/i,
  /index-[a-zA-Z0-9-_]+\.js/i
];
