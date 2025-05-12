
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction pour obtenir l'URL Supabase de façon sécurisée
const getSupabaseUrl = () => {
  // Récupérer l'URL depuis les variables d'environnement de la fonction Edge
  // Ces variables ne sont jamais exposées au client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  // Vérifier si l'URL est définie
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL non définie dans les variables d\'environnement');
  }
  
  return supabaseUrl;
}

// Fonction pour obtenir la clé anonyme Supabase de façon sécurisée
const getSupabaseAnonKey = () => {
  // Récupérer la clé anonyme depuis les variables d'environnement de la fonction Edge
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Vérifier si la clé est définie
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY non définie dans les variables d\'environnement');
  }
  
  return supabaseAnonKey;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupère uniquement les informations publiques qui peuvent être partagées avec le client
    // Les valeurs réelles sont stockées dans les variables d'environnement côté serveur
    const config = {
      supabaseUrl: getSupabaseUrl(),
      supabaseAnonKey: getSupabaseAnonKey(),
    }
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Ajouter des en-têtes pour empêcher la mise en cache
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erreur dans get-public-config:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur inattendue s\'est produite' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
