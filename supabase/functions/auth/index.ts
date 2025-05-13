
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { headers: corsHeaders, status: 405 }
    );
  }

  try {
    // Récupérer les informations du corps de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Erreur de parsing du corps de la requête:", parseError);
      return new Response(
        JSON.stringify({ error: "Format de requête invalide" }),
        { headers: corsHeaders, status: 400 }
      );
    }
    
    const { action, email, password } = requestBody;

    // Créer un client Supabase avec la clé de service (plus sécurisé)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuration Supabase manquante");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;
    
    // Exécuter l'action demandée
    switch (action) {
      case "login":
        if (!email || !password) {
          throw new Error("Email et mot de passe requis");
        }
        
        // Utiliser signInWithPassword pour authentifier l'utilisateur
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        // Ne renvoyer que les données nécessaires (pas d'URL Supabase)
        result = {
          session: data.session,
          user: data.user
        };
        break;
        
      case "logout":
        const { error: logoutError } = await supabase.auth.admin.signOut({
          scope: 'global'
        });
        
        if (logoutError) throw logoutError;
        
        result = { success: true };
        break;
        
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    // Renvoyer le résultat de l'opération
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    
    // Ne pas inclure d'URL Supabase dans les messages d'erreur
    const safeErrorMessage = error.message?.replace(/https:\/\/[^\/]+\.supabase\.co/g, "***");
    
    return new Response(
      JSON.stringify({ 
        error: safeErrorMessage || "Erreur d'authentification" 
      }),
      { headers: corsHeaders, status: error.status || 400 }
    );
  }
});
