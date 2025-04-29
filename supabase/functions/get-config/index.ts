
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as jose from 'https://esm.sh/jose@5.2.3';

// Définition des headers CORS pour permettre l'accès depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Fonction principale qui sera servie
serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Récupération des variables d'environnement depuis les Secrets Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    // Vérification que les valeurs existent
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Erreur de configuration: SUPABASE_URL ou SUPABASE_ANON_KEY non définis');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration incomplète sur le serveur' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    // Retour des valeurs de configuration
    return new Response(
      JSON.stringify({
        supabaseUrl,
        supabaseAnonKey,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    // Gestion des erreurs
    console.error('Erreur lors de la récupération de la configuration:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur lors de la récupération de la configuration' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
