
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
      supabaseAnonKey = 'fallback-key';
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

// Créer une version du client Supabase qui s'initialise à la demande
let clientInitPromise: Promise<ReturnType<typeof createClient<Database>>> | null = null;

// Proxy pour intercepter les appels au client Supabase et s'assurer qu'il est initialisé
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: function(target, prop) {
    if (!clientInitPromise) {
      clientInitPromise = initSupabaseClient();
    }
    
    // Renvoyer une fonction qui attend l'initialisation du client avant d'appeler la méthode demandée
    return async function(...args: any[]) {
      const client = await clientInitPromise;
      const method = client[prop as keyof typeof client];
      
      if (typeof method === 'function') {
        return method.apply(client, args);
      } else {
        return method;
      }
    };
  }
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
  
  // Réinitialiser le client pour qu'il soit recréé lors du prochain appel
  supabaseClient = null;
  clientInitPromise = null;
};

// Version synchrone pour les cas d'utilisation simples qui ne nécessitent pas d'attendre l'initialisation
export const getSupabaseClient = async () => {
  if (!clientInitPromise) {
    clientInitPromise = initSupabaseClient();
  }
  return clientInitPromise;
};
