
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupération de l'origine de la requête pour le journalisation
    const origin = req.headers.get('origin') || '';
    console.log(`Requête reçue de: ${origin}`);
    
    // La clé anon est stockée en tant que secret d'environnement côté serveur
    // Elle n'est jamais exposée dans le code source côté client
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!anonKey) {
      console.error("Clé API Supabase non trouvée dans les variables d'environnement");
      throw new Error("Missing environment variables");
    }
    
    console.log("Clé API Supabase récupérée avec succès");
    
    // Renvoie uniquement la clé anon, pas l'URL complète
    // L'URL peut être construite à partir de l'ID du projet qui est public
    return new Response(
      JSON.stringify({ 
        anonKey,
        timestamp: new Date().toISOString() // Utile pour le débogage
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
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
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
