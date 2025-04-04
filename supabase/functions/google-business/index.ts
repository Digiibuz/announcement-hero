import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') as string
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') as string
const REDIRECT_URI = Deno.env.get('GMB_REDIRECT_URI') as string
const API_BASE_URL = 'https://mybusiness.googleapis.com/v4'

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Client Supabase avec clé service pour accéder à la DB sans restrictions
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

// Client Supabase standard pour les appels authentifiés
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

// Fonction utilitaire pour la gestion des erreurs
function handleError(error: any) {
  console.error("Erreur:", error)
  return new Response(
    JSON.stringify({ error: error.message || "Une erreur s'est produite" }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Fonction pour récupérer le profil GMB d'un utilisateur
async function getUserGoogleProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_google_business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error("Erreur lors de la récupération du profil Google:", error)
    return null
  }
  
  return data
}

// Fonction pour générer l'URL d'autorisation OAuth
function getGoogleAuthUrl(state: string) {
  // Vérifier que les variables d'environnement nécessaires sont définies
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement')
  }
  
  if (!REDIRECT_URI) {
    throw new Error('GMB_REDIRECT_URI non défini dans les variables d\'environnement')
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    state: state,
    prompt: 'consent', // Forcer l'affichage du consentement pour obtenir un refresh token
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Fonction pour échanger le code contre des tokens
async function exchangeCodeForTokens(code: string) {
  // Vérifier que les variables d'environnement nécessaires sont définies
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID non défini dans les variables d\'environnement')
  }
  
  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET non défini dans les variables d\'environnement')
  }
  
  if (!REDIRECT_URI) {
    throw new Error('GMB_REDIRECT_URI non défini dans les variables d\'environnement')
  }
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token'
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
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
  // Gestion des requêtes préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Vérifier que les variables d'environnement sont définies
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables d\'environnement Supabase manquantes')
    }
    
    // Récupérer les données du corps de la requête
    const requestData = await req.json()
    const action = requestData.action
    
    // Log pour le débogage
    console.log(`Action requise: ${action}`)
    
    // Extraire le token JWT pour obtenir l'ID utilisateur
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié')
    }
    
    const userId = user.id
    
    // Traiter les différentes actions
    if (action === 'get_auth_url') {
      try {
        // Générer l'URL d'autorisation OAuth
        const state = userId // Utiliser l'ID utilisateur comme state
        const authUrl = getGoogleAuthUrl(state)
        
        console.log(`URL d'autorisation générée: ${authUrl}`)
        
        return new Response(
          JSON.stringify({ url: authUrl }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error("Erreur lors de la génération de l'URL d'autorisation:", error)
        return handleError(error)
      }
    } 
    else if (action === 'handle_callback') {
      // Traiter le callback OAuth
      const code = requestData.code
      const state = requestData.state
      
      if (!code) {
        throw new Error('Code d\'autorisation manquant')
      }
      
      if (state !== userId) {
        throw new Error('État invalide')
      }
      
      // Échanger le code contre des tokens
      const tokenData = await exchangeCodeForTokens(code)
      const { access_token, refresh_token, expires_in } = tokenData
      
      // Récupérer les informations de l'utilisateur Google
      const userInfo = await getGoogleUserInfo(access_token)
      
      // Calculer l'expiration du token
      const tokenExpiresAt = new Date()
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in)
      
      // Stocker les tokens dans la base de données
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .upsert({
          user_id: userId,
          google_email: userInfo.email,
          refresh_token,
          access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
        })
      
      if (error) {
        throw new Error(`Erreur lors du stockage des tokens: ${error.message}`)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Compte Google lié avec succès',
          email: userInfo.email
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } 
    else if (action === 'get_profile') {
      // Récupérer le profil Google de l'utilisateur
      const profile = await getUserGoogleProfile(userId)
      
      return new Response(
        JSON.stringify({ profile }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } 
    else if (action === 'list_accounts') {
      // Lister les comptes GMB
      const profile = await getUserGoogleProfile(userId)
      
      if (!profile) {
        throw new Error('Aucun profil Google lié')
      }
      
      // Vérifier si le token d'accès est expiré
      let accessToken = profile.access_token
      const tokenExpiresAt = new Date(profile.token_expires_at)
      
      if (new Date() >= tokenExpiresAt) {
        // Rafraîchir le token d'accès
        const tokenData = await refreshAccessToken(profile.refresh_token)
        accessToken = tokenData.access_token
        
        // Mettre à jour le token dans la base de données
        const newExpiresAt = new Date()
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in)
        
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId)
      }
      
      // Appeler l'API GMB pour lister les comptes
      const accounts = await listAccounts(accessToken)
      
      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } 
    else if (action === 'list_locations') {
      // Lister les établissements d'un compte GMB
      const accountId = requestData.account_id
      
      if (!accountId) {
        throw new Error('ID de compte manquant')
      }
      
      const profile = await getUserGoogleProfile(userId)
      
      if (!profile) {
        throw new Error('Aucun profil Google lié')
      }
      
      // Vérifier si le token d'accès est expiré
      let accessToken = profile.access_token
      const tokenExpiresAt = new Date(profile.token_expires_at)
      
      if (new Date() >= tokenExpiresAt) {
        // Rafraîchir le token d'accès
        const tokenData = await refreshAccessToken(profile.refresh_token)
        accessToken = tokenData.access_token
        
        // Mettre à jour le token dans la base de données
        const newExpiresAt = new Date()
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in)
        
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId)
      }
      
      // Appeler l'API GMB pour lister les établissements
      const locations = await listLocations(accountId, accessToken)
      
      return new Response(
        JSON.stringify({ locations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } 
    else if (action === 'save_location') {
      // Sauvegarder l'ID de l'établissement sélectionné
      const accountId = requestData.account_id
      const locationId = requestData.location_id
      
      if (!accountId || !locationId) {
        throw new Error('ID de compte ou d\'établissement manquant')
      }
      
      // Mettre à jour le profil avec les IDs sélectionnés
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .update({
          gmb_account_id: accountId,
          gmb_location_id: locationId,
        })
        .eq('user_id', userId)
      
      if (error) {
        throw new Error(`Erreur lors de la sauvegarde des IDs: ${error.message}`)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Établissement sélectionné avec succès' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } 
    else if (action === 'disconnect') {
      // Déconnecter le compte Google
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .delete()
        .eq('user_id', userId)
      
      if (error) {
        throw new Error(`Erreur lors de la déconnexion: ${error.message}`)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Compte Google déconnecté avec succès' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    throw new Error(`Action non reconnue: ${action}`)
  } catch (error) {
    return handleError(error)
  }
})
