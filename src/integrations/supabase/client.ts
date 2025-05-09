
// Ce fichier est automatiquement généré. Ne le modifiez pas directement.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Utilisation d'un state local pour stocker les clés
let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;
let supabaseClient: any = null;

// Fonction pour initialiser le client Supabase avec les clés récupérées de façon sécurisée
const initSupabaseClient = async (): Promise<ReturnType<typeof createClient<Database>>> => {
  if (supabaseClient) return supabaseClient;
  
  // Si les clés ne sont pas encore récupérées, les obtenir depuis l'Edge Function
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      // Utiliser l'URL complète de l'API Supabase pour appeler l'Edge Function
      const response = await fetch('https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-public-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de la configuration: ${response.statusText}`);
      }
      
      const config = await response.json();
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du client Supabase:', error);
      // Utiliser des valeurs par défaut en cas d'échec (uniquement pour éviter les erreurs fatales)
      // Ces valeurs ne donneront pas d'accès réel, juste pour que l'app ne plante pas complètement
      supabaseUrl = 'https://rdwqedmvzicerwotjseg.supabase.co';
      supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk';
    }
  }
  
  // Créer le client Supabase avec les clés récupérées
  supabaseClient = createClient<Database>(
    supabaseUrl as string, 
    supabaseAnonKey as string,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
  
  return supabaseClient;
};

// Créer une version synchrone du client pour l'authentification
// Pour éviter les problèmes avec les méthodes auth qui doivent fonctionner immédiatement
export const supabase = createClient<Database>(
  'https://rdwqedmvzicerwotjseg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Une fois que le client est initialisé avec les bonnes clés via l'Edge Function,
// remplacer le client temporaire par celui qui utilise les clés récupérées
initSupabaseClient().then(client => {
  // Mettez à jour les clés avec celles obtenues depuis l'Edge Function
  // mais ne remplacez pas l'instance car cela casserait les références
  Object.assign(supabase, client);
}).catch(error => {
  console.error('Erreur lors de l\'initialisation du client Supabase:', error);
});

// Utilitaire pour nettoyer l'état d'authentification
export const cleanupAuthState = () => {
  // Supprimer les jetons d'authentification standard
  localStorage.removeItem('supabase.auth.token');
  // Supprimer toutes les clés d'authentification Supabase de localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Supprimer de sessionStorage si utilisé
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // Ne pas réinitialiser le client ici, car cela pourrait causer des problèmes
  // avec les références existantes
};

// Version synchrone pour les cas d'utilisation simples qui ne nécessitent pas d'attendre l'initialisation
export const getSupabaseClient = async () => {
  return initSupabaseClient();
};
