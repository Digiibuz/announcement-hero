
// Ce fichier est automatiquement généré. Ne le modifiez pas directement.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Utilisation d'un state local pour stocker les clés
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Fonction pour initialiser le client Supabase avec les clés récupérées de façon sécurisée
const initSupabaseClient = async (): Promise<ReturnType<typeof createClient<Database>>> => {
  if (supabaseClient) return supabaseClient;
  
  try {
    // Utiliser une variable pour l'URL du service sans exposer directement le nom du projet
    const serviceUrl = new URL('https://supabase.co');
    serviceUrl.hostname = `${process.env.SUPABASE_ID || 'rdwqedmvzicerwotjseg'}.${serviceUrl.hostname}`;
    const configEndpoint = `${serviceUrl.origin}/functions/v1/get-public-config`;
    
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
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Configuration Supabase incomplète: URL ou clé manquante');
    }
    
    console.log('Configuration récupérée avec succès');
    
    // Créer le client Supabase avec les clés récupérées
    supabaseClient = createClient<Database>(
      config.supabaseUrl, 
      config.supabaseAnonKey,
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
    
    // Plutôt que d'utiliser des valeurs de secours codées en dur, afficher une erreur
    // et demander à l'utilisateur de vérifier la connexion internet et de réessayer
    throw new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et rafraîchir la page.');
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
