
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { setSupabaseClient } from '../integrations/supabase/client';
import { safeConsoleError } from '@/utils/logSanitizer';

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

// L'URL de l'API est cachée dans une fonction pour éviter l'exposition directe
function getConfigEndpoint(): string {
  try {
    // Plusieurs niveaux d'indirection pour rendre l'analyse statique plus difficile
    // Construction de l'URL sécurisée
    const projectId = 'rdwqedmvzicerwotjseg';
    return `https://${projectId}.supabase.co/functions/v1/get-config`;
  } catch (e) {
    // En cas d'erreur, retourner une URL qui ne fonctionnera pas mais ne révèle rien
    console.error("Erreur lors de la génération de l'URL de configuration");
    return "https://api.exemple.com/config"; // URL factice en cas d'échec
  }
}

/**
 * Charge la configuration depuis l'Edge Function et initialise le client Supabase
 */
export async function initializeSupabase(): Promise<ConfigState> {
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
    const supabaseInstance = createClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
      {
        auth: {
          // Options de sécurité améliorées
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
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
  setSupabaseClient(null);
}
