
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Temporary Supabase client with minimal configuration
// This will be replaced with the full configuration from the Edge Function
let supabase = createClient<Database>(
  "https://rdwqedmvzicerwotjseg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk"
);

// État de l'authentification
let isInitialized = false;
let initializationError: Error | null = null;
let initializationPromise: Promise<void> | null = null;

// Fonction pour initialiser le client Supabase de manière sécurisée
async function initSupabaseClient(): Promise<void> {
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    try {
      console.log("Initialisation du client Supabase...");
      
      // Récupérer la configuration depuis la fonction Edge
      const response = await fetch("/functions/v1/get-public-config");
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de la configuration: ${response.statusText}`);
      }
      
      const config = await response.json();
      
      if (!config.url || !config.anon_key) {
        throw new Error("Configuration incomplete");
      }
      
      // Créer un nouveau client avec les informations récupérées
      supabase = createClient<Database>(config.url, config.anon_key);
      
      isInitialized = true;
      initializationError = null;
      console.log("Client Supabase initialisé avec les clés du serveur");
    } catch (error) {
      console.error("Erreur d'initialisation du client Supabase:", error);
      initializationError = error instanceof Error ? error : new Error("Erreur inconnue");
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
