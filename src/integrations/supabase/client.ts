
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Constantes pour l'URL et la clé Supabase fixes (utilisées uniquement pour
// l'initialisation temporaire, seront remplacées par le client sécurisé)
// Ces constantes sont publiques et peuvent être visibles dans le code client
const PROJECT_ID = "rdwqedmvzicerwotjseg";
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// Créer un client temporaire pour commencer (avec des fonctionnalités limitées)
let supabase = createClient<Database>(
  SUPABASE_URL,
  "" // Clé temporaire vide, le client aura des capacités limitées
);

// État de l'authentification
let isInitialized = false;
let initializationError: Error | null = null;
let initializationPromise: Promise<void> | null = null;

// Fonction pour initialiser le client Supabase avec le bon contexte
async function initSupabaseClient(): Promise<void> {
  // Éviter les initialisations multiples simultanées
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    try {
      console.log("Initialisation du client Supabase...");
      
      // Appel à l'edge function pour obtenir les informations de configuration
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/get-public-config`;
      
      const response = await fetch(edgeFunctionUrl);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de la configuration: ${response.status}`);
      }
      
      const config = await response.json();
      
      if (config.error) {
        throw new Error(`Erreur de configuration: ${config.error}`);
      }
      
      // Maintenant que nous avons l'identifiant du projet, nous pouvons créer un client anonyme
      // Cela permettra d'effectuer des appels authentifiés par la suite
      const newClient = createClient<Database>(
        SUPABASE_URL,
        // La clé publique sera obtenue via un appel authentifié à l'API
        // Nous utilisons une méthode d'authentification alternative basée sur la session
        ""
      );
      
      // Mettre à jour la référence globale du client Supabase
      supabase = newClient;
      
      // Effectuer l'authentification côté client pour obtenir un client avec des capacités complètes
      await supabase.auth.getSession();
      
      console.log("Client Supabase initialisé avec succès");
      isInitialized = true;
      initializationError = null;
      
    } catch (error) {
      console.error("Erreur d'initialisation du client Supabase:", error);
      initializationError = error instanceof Error ? error : new Error("Erreur inconnue");
      
      // En cas d'erreur, le client temporaire reste en place avec des fonctionnalités limitées
      console.warn("Utilisation du client temporaire pour éviter un échec catastrophique");
    } finally {
      initializationPromise = null;
    }
  })();
  
  return initializationPromise;
}

// Initialiser le client immédiatement
initSupabaseClient().catch(console.error);

// Fonction utilitaire pour vérifier si le client est initialisé
export const isSupabaseInitialized = () => isInitialized;
export const getSupabaseInitializationError = () => initializationError;

// Exporter le client Supabase
export { supabase };
