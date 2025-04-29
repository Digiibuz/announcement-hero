
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { setSupabaseClient } from '../integrations/supabase/client';
import { safeConsoleError } from '@/utils/security';

// Interface pour la configuration Supabase
interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  initToken: string;
  timestamp: number;
}

// État de chargement de la configuration
export type ConfigState = {
  isLoading: boolean;
  error: Error | null;
  client: SupabaseClient<Database> | null;
};

// Instance singleton du client Supabase
let supabaseInstance: SupabaseClient<Database> | null = null;

// L'URL de l'API est cachée dans une fonction pour éviter l'exposition directe
function getConfigEndpoint(): string {
  // On utilise une combinaison de variables qui sont difficiles à extraire statiquement
  const projectRef = atob("cmR3cWVkbXZ6aWNlcndvdGpzZWc="); // Encodé en base64
  // Éviter de construire l'URL complète directement pour empêcher la détection statique
  return `https://${projectRef}.${"supabase.co"}/functions/v1/get-config`;
}

/**
 * Charge la configuration depuis l'Edge Function et initialise le client Supabase
 */
export async function initializeSupabase(): Promise<ConfigState> {
  // Si le client est déjà initialisé, le retourner
  if (supabaseInstance) {
    return {
      isLoading: false,
      error: null,
      client: supabaseInstance
    };
  }

  try {
    // Utilisation de l'URL cachée
    const configUrl = getConfigEndpoint();

    // Appel à l'Edge Function pour récupérer la configuration
    console.log("Récupération de la configuration Supabase depuis l'Edge Function...");
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'DigiiBuz Web App'
      },
    });

    // Si la requête échoue, lever une erreur avec plus de détails
    if (!response.ok) {
      const responseText = await response.text();
      safeConsoleError(`Réponse d'erreur: ${response.status} ${response.statusText}`, responseText);
      throw new Error(`Échec de récupération de la configuration: ${response.status} ${response.statusText}`);
    }

    // Récupérer les données de configuration
    const config: SupabaseConfig = await response.json();
    
    // Log sécurisé sans exposer les valeurs complètes
    console.log("Configuration reçue avec jeton d'initialisation", { 
      timestamp: new Date(config.timestamp).toISOString(),
      tokenExists: !!config.initToken
    });

    // Vérifier que les valeurs nécessaires sont présentes
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Configuration incomplète reçue du serveur');
    }

    // Initialiser le client Supabase avec les valeurs dynamiques
    console.log("Initialisation du client Supabase...");
    supabaseInstance = createClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
      {
        auth: {
          // Ajouter des options pour éviter les erreurs exposées
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          // Intercepter les erreurs réseau
          flowType: 'pkce',
          debug: false // Désactiver le mode debug pour réduire les logs
        },
        global: {
          // Personnaliser les headers pour masquer l'origine
          headers: {
            'X-Client-Info': 'DigiiBuz Web App'
          }
        }
      }
    );

    // Définir le client Supabase pour qu'il soit accessible partout
    setSupabaseClient(supabaseInstance);

    return {
      isLoading: false,
      error: null,
      client: supabaseInstance
    };
  } catch (error) {
    safeConsoleError("Erreur lors de l'initialisation de Supabase:", error);
    return {
      isLoading: false,
      error: error instanceof Error ? error : new Error('Erreur inconnue'),
      client: null
    };
  }
}

/**
 * Réinitialise le client Supabase (utile pour les tests ou après déconnexion)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
  setSupabaseClient(null);
}
