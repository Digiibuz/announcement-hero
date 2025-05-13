
import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

// En-têtes CORS pour permettre l'accès depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier l'authentification de l'utilisateur
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorisation requise' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Variables d\'environnement manquantes');
    }
    
    // Créer un client admin pour vérifier le JWT
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Vérifier le JWT de l'utilisateur
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    
    if (verifyError || !user) {
      return new Response(
        JSON.stringify({ error: 'JWT invalide ou expiré' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Retourner les informations d'authentification au client
    return new Response(
      JSON.stringify({
        anon_key: supabaseAnonKey,
        url: supabaseUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération des informations d\'authentification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
