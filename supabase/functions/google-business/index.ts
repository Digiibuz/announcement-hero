import { serve } from 'std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import * as log from 'std/log/mod.ts';

// Configure logger
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') as string;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') as string;
const REDIRECT_URI = Deno.env.get('GMB_REDIRECT_URI') as string;
const API_BASE_URL = 'https://mybusiness.googleapis.com/v4';

logger.info("Environment variables loaded", {
  supabaseUrl: SUPABASE_URL ? "Set" : "Not set",
  supabaseAnonKey: SUPABASE_ANON_KEY ? "Set" : "Not set",
  supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
  googleClientId: GOOGLE_CLIENT_ID ? "Set" : "Not set",
  googleClientSecret: GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
  redirectUri: REDIRECT_URI ? "Set" : "Not set"
});

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Client Supabase avec clé service pour accéder à la DB sans restrictions
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Client Supabase standard pour les appels authentifiés
const supabaseClient = SUPABASE_URL && SUPABASE_ANON_KEY ? 
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Fonction utilitaire pour la gestion des erreurs
function handleError(error: any) {
  const errorMessage = error.message || "Une erreur s'est produite";
  logger.error("Error:", errorMessage);
  
  if (error.stack) {
    logger.error("Stack trace:", error.stack);
  }
  
  return new Response(
    JSON.stringify({ error: errorMessage }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Fonction pour vérifier les variables d'environnement requises
function checkRequiredEnvVars() {
  const missingVars = [];
  
  if (!GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
  if (!GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
  if (!REDIRECT_URI) missingVars.push('GMB_REDIRECT_URI');
  if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missingVars.length > 0) {
    const errorMsg = `Variables d'environnement manquantes: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  logger.info("Variables d'environnement vérifiées avec succès", {
    clientId: GOOGLE_CLIENT_ID ? "Défini" : "Non défini",
    clientSecret: GOOGLE_CLIENT_SECRET ? "Défini" : "Non défini",
    redirectUri: REDIRECT_URI,
  });
}

// Fonction pour récupérer le profil GMB d'un utilisateur
async function getUserGoogleProfile(userId: string) {
  try {
    if (!supabaseAdmin) {
      throw new Error("Client Supabase Admin non initialisé");
    }
    
    const { data, error } = await supabaseAdmin
      .from('user_google_business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error("Erreur lors de la récupération du profil Google:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error("Exception lors de la récupération du profil Google:", error);
    return null;
  }
}

// Fonction pour générer l'URL d'autorisation OAuth
function getGoogleAuthUrl(state: string) {
  try {
    // Vérifier que les variables d'environnement nécessaires sont définies
    checkRequiredEnvVars();
    
    logger.info("Génération de l'URL d'autorisation avec:", {
      clientId: GOOGLE_CLIENT_ID ? "Défini" : "Non défini",
      redirectUri: REDIRECT_URI,
      state: state
    });
    
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      state: state,
      prompt: 'consent', // Forcer l'affichage du consentement pour obtenir un refresh token
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    logger.info("URL d'autorisation générée:", authUrl);
    
    return authUrl;
  } catch (error) {
    logger.error("Erreur dans getGoogleAuthUrl:", error);
    throw error; // Remonter l'erreur pour un traitement approprié
  }
}

// Fonction pour échanger le code contre des tokens
async function exchangeCodeForTokens(code: string) {
  // Vérifier que les variables d'environnement nécessaires sont définies
  checkRequiredEnvVars();
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token'
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  })
  
  logger.info("Échange du code contre des tokens avec params:", {
    clientId: GOOGLE_CLIENT_ID ? "Défini" : "Non défini",
    clientSecret: GOOGLE_CLIENT_SECRET ? "Défini" : "Non défini",
    redirectUri: REDIRECT_URI,
    code: code ? "Défini" : "Non défini"
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    logger.error("Erreur lors de l'échange de code:", error);
    throw new Error(`Erreur lors de l'échange de code: ${JSON.stringify(error)}`)
  }
  
  return await response.json()
}

// Fonction pour rafraîchir le token d'accès
async function refreshAccessToken(refreshToken: string) {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token'
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erreur lors du rafraîchissement du token: ${JSON.stringify(error)}`)
  }
  
  return await response.json()
}

// Fonction pour récupérer les informations de l'utilisateur Google
async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erreur lors de la récupération des informations utilisateur: ${JSON.stringify(error)}`)
  }
  
  return await response.json()
}

// Fonction pour appeler l'API Google My Business avec le token approprié
async function callGmbApi(endpoint: string, method = 'GET', accessToken: string, body?: any) {
  const url = `${API_BASE_URL}/${endpoint}`
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erreur API GMB: ${JSON.stringify(error)}`)
  }
  
  return await response.json()
}

// Fonction pour lister les comptes GMB
async function listAccounts(accessToken: string) {
  return await callGmbApi('accounts', 'GET', accessToken)
}

// Fonction pour lister les établissements d'un compte GMB
async function listLocations(accountId: string, accessToken: string) {
  return await callGmbApi(`accounts/${accountId}/locations`, 'GET', accessToken)
}

// Point d'entrée principal de l'Edge Function
serve(async (req) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  
  // Gestion des requêtes préflight CORS
  if (req.method === 'OPTIONS') {
    logger.info("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Vérifier que les clients Supabase sont initialisés
    if (!supabaseClient || !supabaseAdmin) {
      throw new Error('Clients Supabase non initialisés. Vérifiez les variables d\'environnement Supabase.');
    }

    // Récupérer les données du corps de la requête
    let requestData;
    try {
      requestData = await req.json();
      logger.info("Données de requête reçues:", JSON.stringify(requestData, null, 2));
    } catch (error) {
      logger.error("Erreur lors de la lecture du corps de la requête:", error);
      throw new Error('Format de requête invalide. Veuillez fournir un JSON valide.');
    }
    
    const action = requestData?.action;
    
    if (!action) {
      throw new Error('Action non spécifiée dans la requête');
    }
    
    // Log pour le débogage
    logger.info(`Action requise: ${action}`);
    
    // Extraire le token JWT pour obtenir l'ID utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const userId = user.id;
    logger.info(`Utilisateur authentifié: ${userId}`);
    
    // Traiter les différentes actions
    if (action === 'get_auth_url') {
      try {
        // Vérifier les variables d'environnement requises
        checkRequiredEnvVars();
        
        // Générer l'URL d'autorisation OAuth
        const state = userId; // Utiliser l'ID utilisateur comme state
        const authUrl = getGoogleAuthUrl(state);
        
        logger.info(`URL d'autorisation générée: ${authUrl}`);
        
        return new Response(
          JSON.stringify({ url: authUrl }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error: any) {
        logger.error("Erreur lors de la génération de l'URL d'autorisation:", error);
        return handleError(error);
      }
    } 
    
    // ... keep existing code (handle_callback, get_profile, list_accounts, list_locations, save_location, disconnect, etc.)
    
    throw new Error(`Action non reconnue: ${action}`);
  } catch (error: any) {
    return handleError(error);
  }
});
