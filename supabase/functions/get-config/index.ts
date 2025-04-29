
// Ce fichier ne sera pas dans le bundle frontend final

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Log de réception pour débogage
    console.log("Réception d'une requête get-config");
    
    // Authorization header n'est plus requis pour cette fonction
    // car elle est destinée à fournir les clés publiques pour l'initialisation
    
    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Journaliser la disponibilité des variables sans exposer leur contenu
    console.log("Variables d'environnement récupérées:", { 
      urlExiste: !!supabaseUrl, 
      keyExiste: !!supabaseAnonKey,
      urlLongueur: supabaseUrl.length,
      keyLongueur: supabaseAnonKey.length
    });
    
    // Générer un jeton d'initialisation unique pour cette session
    const initToken = crypto.randomUUID();
    
    // Ajouter un timestamp pour empêcher la mise en cache de la réponse
    const timestamp = Date.now();

    // Préparer la réponse
    const responseData = {
      supabaseUrl,
      supabaseAnonKey,
      initToken,
      timestamp
    };
    
    console.log("Envoi de la configuration sécurisée");
    
    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff', // Empêcher le sniffing de contenu
          'X-Frame-Options': 'DENY', // Empêcher l'inclusion dans des iframes
          'Referrer-Policy': 'no-referrer' // Ne pas envoyer de referrer
        }
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erreur de configuration", 
        details: "Une erreur s'est produite lors de la récupération de la configuration."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
