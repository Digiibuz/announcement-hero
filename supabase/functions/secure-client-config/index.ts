
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupération de l'origine de la requête pour vérifier qu'elle provient d'un domaine autorisé
    const origin = req.headers.get('origin') || '';
    
    // Liste des domaines autorisés (à adapter selon votre configuration)
    const allowedOrigins = [
      'https://your-production-domain.com',
      'https://your-staging-domain.com',
      'http://localhost:8080',
    ];
    
    // Vérification de sécurité simple
    const isAllowedOrigin = allowedOrigins.some(domain => origin.startsWith(domain));
    
    if (!isAllowedOrigin && origin !== '') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized domain' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // La clé anon est stockée en tant que secret d'environnement côté serveur
    // Elle n'est jamais exposée dans le code source côté client
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!anonKey) {
      throw new Error("Missing environment variables");
    }
    
    // Renvoie uniquement la clé anon, pas l'URL complète
    // L'URL peut être construite à partir de l'ID du projet qui est public
    return new Response(
      JSON.stringify({ 
        anonKey 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Error in secure-client-config function:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
