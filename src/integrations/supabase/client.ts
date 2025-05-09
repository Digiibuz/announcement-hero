
// Ce fichier est automatiquement généré. Ne le modifiez pas directement.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Utilisation d'un state local pour stocker les clés
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// URL de repli en cas d'échec de chargement de la configuration
const FALLBACK_URL = 'https://rdwqedmvzicerwotjseg.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk';

// Fonction pour initialiser le client Supabase avec les clés récupérées de façon sécurisée
const initSupabaseClient = async (): Promise<ReturnType<typeof createClient<Database>>> => {
  if (supabaseClient) return supabaseClient;
  
  try {
    // Essayer d'utiliser l'URL complète pour l'Edge Function en premier
    const configEndpoint = 'https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-public-config';
    console.log('Tentative de récupération de la configuration depuis:', configEndpoint);
    
    const response = await fetch(configEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la configuration: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('La réponse n\'est pas au format JSON valide');
    }
    
    const config = await response.json();
    const supabaseUrl = config.supabaseUrl || FALLBACK_URL;
    const supabaseAnonKey = config.supabaseAnonKey || FALLBACK_ANON_KEY;
    
    console.log('Configuration récupérée avec succès');
    
    // Créer le client Supabase avec les clés récupérées
    supabaseClient = createClient<Database>(
      supabaseUrl, 
      supabaseAnonKey,
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
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du client Supabase:', error);
    console.log('Utilisation des valeurs de secours pour le client Supabase');
    
    // En cas d'erreur, créer un client avec les valeurs de secours
    supabaseClient = createClient<Database>(
      FALLBACK_URL,
      FALLBACK_ANON_KEY,
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
  }
};

// Exporter la fonction pour obtenir le client Supabase
export const getSupabaseClient = async () => {
  if (!supabaseClient) {
    return initSupabaseClient();
  }
  return supabaseClient;
};

// Exporter un proxy pour faciliter l'utilisation du client
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (target, prop) => {
    if (!supabaseClient) {
      // Pour les méthodes auth qui doivent être disponibles immédiatement,
      // initialiser le client de manière synchrone si nécessaire
      initSupabaseClient().catch(console.error);
      
      // En attendant que le client soit initialisé, nous pouvons renvoyer des méthodes
      // provisoires qui mettront en file d'attente les appels jusqu'à ce que le client soit prêt
      if (prop === 'auth') {
        return {
          // Implémentations provisoires des méthodes auth les plus couramment utilisées
          signInWithPassword: async (args: any) => {
            const client = await initSupabaseClient();
            return client.auth.signInWithPassword(args);
          },
          signOut: async (args: any) => {
            const client = await initSupabaseClient();
            return client.auth.signOut(args);
          },
          getSession: async () => {
            const client = await initSupabaseClient();
            return client.auth.getSession();
          },
          resetPasswordForEmail: async (email: string, options?: any) => {
            const client = await initSupabaseClient();
            return client.auth.resetPasswordForEmail(email, options);
          },
          onAuthStateChange: (callback: any) => {
            // Initialiser le client et configurer l'écouteur une fois prêt
            initSupabaseClient()
              .then(client => {
                return client.auth.onAuthStateChange(callback);
              })
              .catch(error => {
                console.error('Erreur lors de la configuration de onAuthStateChange:', error);
                // Retourner un faux abonnement pour éviter les erreurs
                return { data: { subscription: { unsubscribe: () => {} } } };
              });
            
            // Retourner un faux abonnement en attendant le vrai
            return { data: { subscription: { unsubscribe: () => {} } } };
          }
        };
      }
    }
    
    // Si le client est déjà initialisé, accéder directement à ses propriétés
    return supabaseClient ? supabaseClient[prop] : null;
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
};
