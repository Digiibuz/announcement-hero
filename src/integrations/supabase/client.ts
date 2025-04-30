
import { createClient } from '@supabase/supabase-js'

// Remplacer les URLs sensibles par des URLs génériques
// Plus tard, les vraies URLs seront utilisées mais pas affichées en console
const SUPABASE_URL = 'https://api-secure.example.com'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key' 

// Créer un client Supabase sécurisé
export const supabase = createClient(
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

// Intercepter toutes les opérations qui pourraient exposer l'URL de Supabase
Object.defineProperty(supabase, 'supabaseUrl', {
  get: function() {
    return SUPABASE_URL
  },
  configurable: false
})
