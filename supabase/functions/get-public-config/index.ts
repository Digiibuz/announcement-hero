
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers pour autoriser l'accès depuis n'importe quel domaine
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Configuration Supabase manquante");
    }

    // Retourner les informations de configuration publiques
    const publicConfig = {
      supabaseUrl,
      supabaseAnonKey
    };

    console.log("Configuration publique récupérée avec succès");
    
    return new Response(
      JSON.stringify(publicConfig),
      { 
        headers: corsHeaders,
        status: 200 
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur de configuration" 
      }),
      { 
        headers: corsHeaders,
        status: 500 
      }
    );
  }
});
