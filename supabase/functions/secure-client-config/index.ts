
// Supabase Edge Function: secure-client-config
// Cette fonction fournit de manière sécurisée la clé anonyme pour le client Supabase

import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Wrap the response preparation for better error handling
const prepareResponse = (body: any, status = 200) => {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    }
  );
};

const handler = async (req: Request) => {
  // Gérer la requête CORS preflight avec tous les en-têtes nécessaires
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const origin = req.headers.get("origin") || "origine inconnue";
    const retryAttempt = req.headers.get("x-retry-attempt") || "0";
    console.log(`Requête reçue de: ${origin} (tentative: ${retryAttempt})`);
    
    // Récupération de la clé API depuis les variables d'environnement
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!anonKey) {
      console.error("Erreur: Clé API non définie dans les variables d'environnement");
      return prepareResponse({ 
        error: "Configuration serveur manquante", 
        details: "La clé API Supabase n'est pas définie dans les variables d'environnement",
        origin: origin,
        timestamp: new Date().toISOString()
      }, 500);
    }

    // Ajout de vérifications supplémentaires
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) {
      console.error("URL Supabase non définie");
      return prepareResponse({ 
        error: "Configuration serveur incomplète", 
        details: "L'URL Supabase n'est pas définie",
        origin: origin,
        timestamp: new Date().toISOString()
      }, 500);
    }

    console.log("Clé API Supabase récupérée avec succès");
    
    // Ajouter des informations de débuggage dans la réponse
    return prepareResponse({
      anonKey,
      url,
      timestamp: new Date().toISOString(),
      origin: origin,
      success: true
    });
  } catch (error: any) {
    console.error("Erreur lors du traitement de la requête:", error);
    return prepareResponse({ 
      error: "Erreur serveur", 
      details: error.message || "Une erreur inconnue s'est produite",
      timestamp: new Date().toISOString() 
    }, 500);
  }
};

// Définir le gestionnaire de requêtes HTTP
serve(handler);
