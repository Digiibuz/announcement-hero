import { serve } from "std/http/server.ts";
import * as log from "std/log/mod.ts";
import { createClient } from "supabase";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') as string;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') as string;
const REDIRECT_URI = Deno.env.get('GMB_REDIRECT_URI') as string;
const API_BASE_URL = 'https://mybusiness.googleapis.com/v4';

// Configuration pour le logging
try {
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
} catch (error) {
  console.error("Erreur lors de la configuration du logger:", error);
}

const logger = log.getLogger();

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Client Supabase avec clé service pour accéder à la DB sans restrictions
let supabaseAdmin;
try {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Erreur lors de la création du client Supabase Admin:", error);
}

// Client Supabase standard pour les appels authentifiés
let supabaseClient;
try {
  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} catch (error) {
  console.error("Erreur lors de la création du client Supabase Client:", error);
}

// Fonction utilitaire pour la gestion des erreurs
function handleError(error: any) {
  // Amélioration: Tracer toute la stack et les propriétés d'erreur
  const errorDetails = {
    message: error.message || "Erreur inconnue",
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    toString: error.toString(),
    // Inclure les détails supplémentaires si disponibles
    details: error.details || error.error || error.data,
  };
  
  console.error("Erreur détaillée:", JSON.stringify(errorDetails, null, 2));
  
  return new Response(
    JSON.stringify({ 
      error: error.message || "Une erreur s'est produite",
      details: errorDetails
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Fonction pour récupérer le profil GMB d'un utilisateur
async function getUserGoogleProfile(userId: string) {
  try {
    logger.info(`Recherche du profil Google pour l'utilisateur: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('user_google_business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error(`Erreur lors de la récupération du profil Google: ${JSON.stringify(error)}`);
      return null;
    }
    
    logger.info(`Profil Google trouvé: ${JSON.stringify(data)}`);
    return data;
  } catch (err) {
    logger.error(`Exception lors de la récupération du profil Google: ${JSON.stringify(err)}`);
    return null;
  }
}

// Fonction pour générer l'URL d'autorisation OAuth
function getGoogleAuthUrl(state: string) {
  logger.info(`Génération d'URL d'autorisation pour l'état: ${state}`);
  
  // Vérifier que les variables d'environnement nécessaires sont définies
  if (!GOOGLE_CLIENT_ID) {
    logger.error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement');
    throw new Error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement');
  }
  
  if (!REDIRECT_URI) {
    logger.error('GMB_REDIRECT_URI non défini dans les variables d\'environnement');
    throw new Error('GMB_REDIRECT_URI non défini dans les variables d\'environnement');
  }
  
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
  logger.info(`URL d'autorisation générée: ${authUrl}`);
  return authUrl;
}

// Fonction pour échanger le code contre des tokens
async function exchangeCodeForTokens(code: string) {
  logger.info(`Échange du code d'autorisation contre des tokens. Code length: ${code.length}`);
  
  // Vérifier que les variables d'environnement nécessaires sont définies
  if (!GOOGLE_CLIENT_ID) {
    logger.error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement');
    throw new Error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement');
  }
  
  if (!GOOGLE_CLIENT_SECRET) {
    logger.error('GOOGLE_CLIENT_SECRET non défini dans les variables d\'environnement');
    throw new Error('GOOGLE_CLIENT_SECRET non défini dans les variables d\'environnement');
  }
  
  if (!REDIRECT_URI) {
    logger.error('GMB_REDIRECT_URI non défini dans les variables d\'environnement');
    throw new Error('GMB_REDIRECT_URI non défini dans les variables d\'environnement');
  }
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });
  
  try {
    logger.info(`Envoi de la requête à ${tokenEndpoint}`);
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Erreur lors de l'échange de code (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Erreur lors de l'échange de code: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    logger.info(`Tokens reçus avec succès. access_token length: ${data.access_token?.length}, refresh_token présent: ${!!data.refresh_token}`);
    return data;
  } catch (err) {
    logger.error(`Exception lors de l'échange de code: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Fonction pour rafraîchir le token d'accès
async function refreshAccessToken(refreshToken: string) {
  logger.info(`Rafraîchissement du token d'accès`);
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  
  try {
    logger.info(`Envoi de la requête de rafraîchissement à ${tokenEndpoint}`);
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Erreur lors du rafraîchissement du token (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Erreur lors du rafraîchissement du token: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    logger.info(`Token rafraîchi avec succès. Nouveau token length: ${data.access_token?.length}`);
    return data;
  } catch (err) {
    logger.error(`Exception lors du rafraîchissement du token: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Fonction pour récupérer les informations de l'utilisateur Google
async function getGoogleUserInfo(accessToken: string) {
  logger.info(`Récupération des informations utilisateur Google`);
  
  try {
    const userInfoEndpoint = 'https://www.googleapis.com/userinfo/v2/me';
    logger.info(`Envoi de la requête à ${userInfoEndpoint}`);
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Erreur lors de la récupération des informations utilisateur (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Erreur lors de la récupération des informations utilisateur: ${JSON.stringify(errorData)}`);
    }
    
    const userInfo = await response.json();
    logger.info(`Informations utilisateur récupérées: ${JSON.stringify(userInfo)}`);
    return userInfo;
  } catch (err) {
    logger.error(`Exception lors de la récupération des informations utilisateur: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Fonction pour appeler l'API Google My Business avec le token approprié
async function callGmbApi(endpoint: string, method = 'GET', accessToken: string, body?: any) {
  const url = `${API_BASE_URL}/${endpoint}`;
  logger.info(`Appel à l'API GMB: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
    logger.info(`Corps de la requête: ${options.body}`);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Log de la réponse brute pour le débogage
    const responseText = await response.text();
    logger.info(`Réponse brute de l'API: ${responseText}`);
    
    // Analyser la réponse en JSON si possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      logger.error(`Erreur lors de l'analyse de la réponse JSON: ${e}`);
      responseData = { text: responseText };
    }
    
    if (!response.ok) {
      logger.error(`Erreur API GMB (${response.status}): ${JSON.stringify(responseData)}`);
      throw new Error(`Erreur API GMB (${response.status}): ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (err) {
    logger.error(`Exception lors de l'appel à l'API GMB: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Fonction pour lister les comptes GMB
async function listAccounts(accessToken: string) {
  logger.info(`Listage des comptes GMB`);
  return await callGmbApi('accounts', 'GET', accessToken);
}

// Fonction pour lister les établissements d'un compte GMB
async function listLocations(accountId: string, accessToken: string) {
  logger.info(`Listage des établissements pour le compte: ${accountId}`);
  return await callGmbApi(`accounts/${accountId}/locations`, 'GET', accessToken);
}

// Point d'entrée principal de l'Edge Function
serve(async (req) => {
  // Log détaillé de chaque requête
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Nouvelle requête: ${req.method} ${req.url}`);
  
  try {
    // Gestion des requêtes préflight CORS
    if (req.method === 'OPTIONS') {
      console.log(`[${requestId}] Traitement de la requête préflight CORS`);
      return new Response(null, { headers: corsHeaders });
    }
    
    // Vérification des variables d'environnement
    const envVarStatus = {
      SUPABASE_URL: !!SUPABASE_URL ? "défini" : "manquant",
      SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY ? "défini" : "manquant",
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY ? "défini" : "manquant",
      GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID ? "défini" : "manquant",
      GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET ? "défini" : "manquant",
      REDIRECT_URI: !!REDIRECT_URI ? "défini" : "manquant"
    };
    
    console.log(`[${requestId}] Statut des variables d'environnement:`, JSON.stringify(envVarStatus));
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${requestId}] Variables d'environnement Supabase manquantes`);
      throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez la configuration des secrets.');
    }
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
      console.error(`[${requestId}] Variables d'environnement Google manquantes`);
      throw new Error('Variables d\'environnement Google manquantes. Vérifiez la configuration des secrets.');
    }
    
    // Récupérer les données du corps de la requête
    let requestData;
    try {
      requestData = await req.json();
      console.log(`[${requestId}] Données de requête:`, JSON.stringify(requestData));
    } catch (e) {
      console.error(`[${requestId}] Erreur lors du parsing du JSON:`, e);
      throw new Error(`Erreur lors du parsing du JSON: ${e.message || e}`);
    }
    
    const action = requestData?.action;
    console.log(`[${requestId}] Action requise: ${action}`);
    
    if (!action) {
      throw new Error('Action non spécifiée dans la requête');
    }
    
    // Extraire le token JWT pour obtenir l'ID utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] Token d'authentification manquant`);
      throw new Error('Token d\'authentification manquant');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Tentative d'authentification avec token JWT`);
    
    // Vérification du token et récupération des informations utilisateur
    let user;
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      
      if (error) {
        console.error(`[${requestId}] Erreur d'authentification:`, error);
        throw new Error(`Erreur d'authentification: ${error.message}`);
      }
      
      user = data?.user;
      
      if (!user) {
        console.error(`[${requestId}] Utilisateur non trouvé avec le token fourni`);
        throw new Error('Utilisateur non authentifié');
      }
      
      console.log(`[${requestId}] Utilisateur authentifié: ${user.id}`);
    } catch (authError) {
      console.error(`[${requestId}] Erreur lors de l'authentification:`, authError);
      throw new Error(`Erreur lors de l'authentification: ${authError.message || authError}`);
    }
    
    const userId = user.id;
    
    // Traiter les différentes actions
    if (action === 'get_auth_url') {
      try {
        console.log(`[${requestId}] Traitement de l'action get_auth_url`);
        
        // Générer l'URL d'autorisation OAuth
        const state = userId; // Utiliser l'ID utilisateur comme state
        const authUrl = getGoogleAuthUrl(state);
        
        console.log(`[${requestId}] URL d'autorisation générée: ${authUrl}`);
        
        return new Response(
          JSON.stringify({ url: authUrl, success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error(`[${requestId}] Erreur lors de la génération de l'URL d'autorisation:`, error);
        return handleError(error);
      }
    } 
    else if (action === 'handle_callback') {
      // Traiter le callback OAuth
      logger.info(`[${requestId}] Traitement de l'action handle_callback`);
      
      const code = requestData.code;
      const state = requestData.state;
      
      if (!code) {
        logger.error(`[${requestId}] Code d'autorisation manquant`);
        throw new Error('Code d\'autorisation manquant');
      }
      
      logger.info(`[${requestId}] Vérification de l'état: reçu=${state}, attendu=${userId}`);
      if (state !== userId) {
        logger.error(`[${requestId}] État invalide: ${state} != ${userId}`);
        throw new Error('État invalide');
      }
      
      // Échanger le code contre des tokens
      logger.info(`[${requestId}] Échange du code contre des tokens`);
      const tokenData = await exchangeCodeForTokens(code);
      const { access_token, refresh_token, expires_in } = tokenData;
      
      // Récupérer les informations de l'utilisateur Google
      logger.info(`[${requestId}] Récupération des informations utilisateur Google`);
      const userInfo = await getGoogleUserInfo(access_token);
      
      // Calculer l'expiration du token
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in);
      
      // Stocker les tokens dans la base de données
      logger.info(`[${requestId}] Stockage des tokens pour l'utilisateur: ${userId}, email Google: ${userInfo.email}`);
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .upsert({
          user_id: userId,
          google_email: userInfo.email,
          refresh_token,
          access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
        });
      
      if (error) {
        logger.error(`[${requestId}] Erreur lors du stockage des tokens: ${JSON.stringify(error)}`);
        throw new Error(`Erreur lors du stockage des tokens: ${error.message}`);
      }
      
      logger.info(`[${requestId}] Callback traité avec succès`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Compte Google lié avec succès',
          email: userInfo.email
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'get_profile') {
      // Récupérer le profil Google de l'utilisateur
      logger.info(`[${requestId}] Récupération du profil Google pour l'utilisateur: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      return new Response(
        JSON.stringify({ profile }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_accounts') {
      // Lister les comptes GMB
      logger.info(`[${requestId}] Listage des comptes GMB pour l'utilisateur: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      if (!profile) {
        logger.error(`[${requestId}] Aucun profil Google lié pour l'utilisateur: ${userId}`);
        throw new Error('Aucun profil Google lié');
      }
      
      // Vérifier si le token d'accès est expiré
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Vérification de l'expiration du token: expire le ${tokenExpiresAt.toISOString()}, maintenant: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        // Rafraîchir le token d'accès
        logger.info(`[${requestId}] Token expiré, rafraîchissement...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
        // Mettre à jour le token dans la base de données
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
        
        logger.info(`[${requestId}] Mise à jour du token dans la base de données, expire le: ${newExpiresAt.toISOString()}`);
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId);
      }
      
      // Appeler l'API GMB pour lister les comptes
      logger.info(`[${requestId}] Appel de l'API GMB pour lister les comptes`);
      const accounts = await listAccounts(accessToken);
      
      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_locations') {
      // Lister les établissements d'un compte GMB
      const accountId = requestData.account_id;
      logger.info(`[${requestId}] Listage des établissements pour le compte: ${accountId}`);
      
      if (!accountId) {
        logger.error(`[${requestId}] ID de compte manquant`);
        throw new Error('ID de compte manquant');
      }
      
      const profile = await getUserGoogleProfile(userId);
      
      if (!profile) {
        logger.error(`[${requestId}] Aucun profil Google lié pour l'utilisateur: ${userId}`);
        throw new Error('Aucun profil Google lié');
      }
      
      // Vérifier si le token d'accès est expiré
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Vérification de l'expiration du token: expire le ${tokenExpiresAt.toISOString()}, maintenant: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        // Rafraîchir le token d'accès
        logger.info(`[${requestId}] Token expiré, rafraîchissement...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
        // Mettre à jour le token dans la base de données
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
        
        logger.info(`[${requestId}] Mise à jour du token dans la base de données, expire le: ${newExpiresAt.toISOString()}`);
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId);
      }
      
      // Appeler l'API GMB pour lister les établissements
      logger.info(`[${requestId}] Appel de l'API GMB pour lister les établissements du compte: ${accountId}`);
      const locations = await listLocations(accountId, accessToken);
      
      return new Response(
        JSON.stringify({ locations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'save_location') {
      // Sauvegarder l'ID de l'établissement sélectionné
      const accountId = requestData.account_id;
      const locationId = requestData.location_id;
      logger.info(`[${requestId}] Sauvegarde de l'établissement: ${locationId} du compte: ${accountId}`);
      
      if (!accountId || !locationId) {
        logger.error(`[${requestId}] ID de compte ou d'établissement manquant`);
        throw new Error('ID de compte ou d\'établissement manquant');
      }
      
      // Mettre à jour le profil avec les IDs sélectionnés
      logger.info(`[${requestId}] Mise à jour des IDs dans la base de données pour l'utilisateur: ${userId}`);
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .update({
          gmb_account_id: accountId,
          gmb_location_id: locationId,
        })
        .eq('user_id', userId);
      
      if (error) {
        logger.error(`[${requestId}] Erreur lors de la sauvegarde des IDs: ${JSON.stringify(error)}`);
        throw new Error(`Erreur lors de la sauvegarde des IDs: ${error.message}`);
      }
      
      logger.info(`[${requestId}] Établissement sauvegardé avec succès`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Établissement sélectionné avec succès' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'disconnect') {
      // Déconnecter le compte Google
      logger.info(`[${requestId}] Déconnexion du compte Google pour l'utilisateur: ${userId}`);
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        logger.error(`[${requestId}] Erreur lors de la déconnexion: ${JSON.stringify(error)}`);
        throw new Error(`Erreur lors de la déconnexion: ${error.message}`);
      }
      
      logger.info(`[${requestId}] Compte Google déconnecté avec succès`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Compte Google déconnecté avec succès' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.error(`[${requestId}] Action non reconnue: ${action}`);
    throw new Error(`Action non reconnue: ${action}`);
  } catch (error) {
    console.error(`[${requestId}] Erreur non gérée:`, error);
    console.error(`[${requestId}] Stack trace:`, error.stack);
    return handleError(error);
  }
});
