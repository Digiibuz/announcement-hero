
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Constantes pour l'URL et la clé Supabase fixes
const PROJECT_ID = "rdwqedmvzicerwotjseg";
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk";

// Créer un client Supabase directement avec les clés prédéfinies
// Ces informations sont publiques et peuvent être incluses dans le code client
let supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// État de l'authentification
let isInitialized = true;
let initializationError: Error | null = null;
let initializationPromise: Promise<void> | null = null;

// Fonction pour initialiser le client Supabase (conservée pour compatibilité)
async function initSupabaseClient(): Promise<void> {
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    try {
      console.log("Client Supabase déjà initialisé avec les clés prédéfinies");
      isInitialized = true;
      initializationError = null;
    } catch (error) {
      console.error("Erreur d'initialisation du client Supabase:", error);
      initializationError = error instanceof Error ? error : new Error("Erreur inconnue");
    } finally {
      initializationPromise = null;
    }
  })();
  
  return initializationPromise;
}

// Initialiser le client immédiatement (pour compatibilité)
initSupabaseClient().catch(console.error);

// Fonction utilitaire pour vérifier si le client est initialisé
export const isSupabaseInitialized = () => isInitialized;
export const getSupabaseInitializationError = () => initializationError;

// Exporter le client Supabase
export { supabase };
