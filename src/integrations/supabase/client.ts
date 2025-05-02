
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
      detectSessionInUrl: false, // Désactiver pour éviter les erreurs de console
      flowType: 'pkce' // Utiliser PKCE pour plus de sécurité
    },
    global: {
      headers: {
        'X-Client-Info': 'DigiiBuz Web App'
      },
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

// Protection avancée contre les fuites d'URL - Remplacer complètement les URLs sensibles
(function() {
  // Stocker les fonctions originales
  const originalFetch = window.fetch;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  // Remplacer fetch pour masquer complètement les URLs sensibles
  window.fetch = function(input, init) {
    try {
      const url = input instanceof Request ? input.url : String(input);
      
      // Vérifier si l'URL contient des patterns sensibles
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(url))) {
        // Désactiver tous les logs pendant cette requête
        console.error = function() {};
        console.warn = function() {};
        console.log = function() {};
        
        // Bloquer tous les événements d'erreur
        const errorHandler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          return true;
        };
        
        window.addEventListener('error', errorHandler, true);
        window.addEventListener('unhandledrejection', errorHandler, true);
        
        // Exécuter la requête
        const promise = originalFetch(input, init);
        
        // Restaurer les fonctions après un délai
        setTimeout(function() {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          console.log = originalConsoleLog;
          window.removeEventListener('error', errorHandler, true);
          window.removeEventListener('unhandledrejection', errorHandler, true);
        }, 1000);
        
        return promise;
      }
      
      // Pour les autres URL, comportement normal
      return originalFetch(input, init);
    } catch (e) {
      // En cas d'erreur, exécuter normalement mais empêcher les logs
      return originalFetch(input, init).catch(err => {
        // Ne pas logger l'erreur si elle contient des informations sensibles
        if (String(err).match(/(supabase|auth|token|password)/i)) {
          throw new Error("Erreur réseau");
        }
        throw err;
      });
    }
  };
})();
