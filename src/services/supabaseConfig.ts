
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { setSupabaseClient } from '../integrations/supabase/client';

// Interface pour la configuration Supabase
interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// État de chargement de la configuration
export type ConfigState = {
  isLoading: boolean;
  error: Error | null;
  client: SupabaseClient<Database> | null;
};

// Instance singleton du client Supabase
let supabaseInstance: SupabaseClient<Database> | null = null;

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
    // Au lieu d'utiliser directement l'URL du projet (qui serait visible dans le build),
    // nous utilisons une URL relative pour l'Edge Function
    const configUrl = `/api/get-config`;

    // Appel à l'Edge Function pour récupérer la configuration
    console.log("Récupération de la configuration Supabase depuis l'Edge Function...");
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Si la requête échoue, lever une erreur
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Échec de récupération de la configuration: ${response.status} ${JSON.stringify(errorData)}`);
    }

    // Récupérer les données de configuration
    const config: SupabaseConfig = await response.json();

    // Vérifier que les valeurs nécessaires sont présentes
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Configuration incomplète reçue du serveur');
    }

    // Initialiser le client Supabase avec les valeurs dynamiques
    console.log("Initialisation du client Supabase avec la configuration dynamique...");
    supabaseInstance = createClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    // Définir le client Supabase pour qu'il soit accessible partout
    setSupabaseClient(supabaseInstance);

    return {
      isLoading: false,
      error: null,
      client: supabaseInstance
    };
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Supabase:", error);
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
