
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
    // Au lieu d'utiliser /api/get-config qui peut être mal routé, utilisons le chemin complet
    // L'URL doit pointer vers l'edge function avec le projet Supabase spécifique
    const configUrl = `https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-config`;

    // Appel à l'Edge Function pour récupérer la configuration
    console.log("Récupération de la configuration Supabase depuis l'Edge Function...");
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Nous ajoutons des informations pour le debug
        'X-Client-Info': 'DigiiBuz Web App'
      },
    });

    // Si la requête échoue, lever une erreur avec plus de détails
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Réponse d'erreur: ${response.status} ${response.statusText}`, responseText);
      throw new Error(`Échec de récupération de la configuration: ${response.status} ${response.statusText}`);
    }

    // Récupérer les données de configuration
    const config: SupabaseConfig = await response.json();
    console.log("Configuration reçue:", { urlLength: config.supabaseUrl?.length, keyLength: config.supabaseAnonKey?.length });

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
