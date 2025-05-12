
// Ce fichier est automatiquement généré. Ne le modifiez pas directement.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Utilisation d'un state local pour stocker les clés
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Fonction pour décrypter les valeurs reçues de la fonction Edge
function decryptValue(encrypted: string): string {
  try {
    // La valeur chiffrée est au format: encodedData.signature.randomSuffix
    const parts = encrypted.split('.');
    if (parts.length < 2) {
      throw new Error("Format de données chiffrées invalide");
    }
    
    const encodedData = parts[0];
    
    // Décoder la valeur de base64
    const decoded = atob(encodedData);
    
    // Extraire le vecteur d'initialisation (IV) (les 12 premiers caractères)
    const ivString = decoded.substring(0, 12);
    const encryptedData = decoded.substring(12);
    
    // Transformation inverse pour retrouver la valeur originale
    // On utilise la même clé XOR que sur le serveur (ne pas exposer la vraie clé)
    // Cette clé doit correspondre à celle utilisée dans la fonction Edge
    const ENCRYPTION_KEY = "k3y@S3cur1ty#Str0ng!2025";
    
    const detransformed = encryptedData
      .split('')
      .map((char, index) => {
        // XOR inverse avec les mêmes caractères de clé
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ (keyChar % 5));
      })
      .join('');
    
    // Extraire la valeur originale (avant le premier séparateur ':')
    const originalParts = detransformed.split(':');
    if (originalParts.length < 2) {
      throw new Error("Données corrompues après déchiffrement");
    }
    
    return originalParts[0];
  } catch (e) {
    console.error('Erreur lors du décryptage:', e);
    throw new Error('Impossible de décrypter les informations de connexion. Vérifiez votre connexion et réessayez.');
  }
}

// Fonction pour initialiser le client Supabase avec les clés récupérées de façon sécurisée
const initSupabaseClient = async (): Promise<ReturnType<typeof createClient<Database>>> => {
  if (supabaseClient) return supabaseClient;
  
  try {
    // Déterminer l'URL de la fonction Edge en fonction de l'environnement
    let configEndpoint = '';
    
    // Utiliser l'URL complète pour éviter les problèmes CORS et assurer une connexion sécurisée
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // En développement local
      configEndpoint = `${window.location.protocol}//${window.location.hostname}:54321/functions/v1/get-public-config`;
    } else {
      // En production
      // Utiliser une URL absolue et cryptée via une fonction Edge
      const projectRef = 'rdwqedmvzicerwotjseg'; // Référence statique du projet
      configEndpoint = `https://${projectRef}.supabase.co/functions/v1/get-public-config`;
    }
    
    console.log('Tentative de récupération de la configuration sécurisée');
    
    const response = await fetch(configEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la configuration: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('La réponse n\'est pas au format JSON valide');
    }
    
    const encryptedConfig = await response.json();
    
    if (!encryptedConfig.supabaseUrl || !encryptedConfig.supabaseAnonKey) {
      throw new Error('Configuration Supabase incomplète: URL ou clé manquante');
    }
    
    // Décrypter les valeurs reçues avec la nouvelle méthode
    const supabaseUrl = decryptValue(encryptedConfig.supabaseUrl);
    const supabaseAnonKey = decryptValue(encryptedConfig.supabaseAnonKey);
    
    console.log('Configuration sécurisée récupérée et décryptée avec succès');
    
    // Créer le client Supabase avec les clés récupérées et décryptées
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
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation du client Supabase:', error);
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
