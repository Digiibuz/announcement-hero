
import { serve } from "std/server.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log("AUTH EDGE FUNCTION: Received request", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    console.log("AUTH EDGE FUNCTION: Invalid method", req.method);
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
      console.log("AUTH EDGE FUNCTION: Request body parsed", 
        JSON.stringify({ action: requestBody?.action })
      );
    } catch (parseError) {
      console.error("AUTH EDGE FUNCTION: Error parsing request body", parseError);
      return new Response(
        JSON.stringify({ error: "Format de requête invalide", details: parseError.message }),
        { headers: corsHeaders, status: 400 }
      );
    }
    
    const { action, email, password } = requestBody;

    // Créer un client Supabase avec la clé de service (plus sécurisé)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("AUTH EDGE FUNCTION: Missing Supabase config");
      throw new Error("Configuration Supabase manquante");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("AUTH EDGE FUNCTION: Supabase client created");

    let result;
    
    // Exécuter l'action demandée
    switch (action) {
      case "login":
        if (!email || !password) {
          console.error("AUTH EDGE FUNCTION: Missing email or password");
          throw new Error("Email et mot de passe requis");
        }
        
        console.log("AUTH EDGE FUNCTION: Attempting login for", email);
        // Utiliser signInWithPassword pour authentifier l'utilisateur
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error("AUTH EDGE FUNCTION: Login error", error.message);
          throw error;
        }
        
        console.log("AUTH EDGE FUNCTION: Login successful");
        // Ne renvoyer que les données nécessaires
        result = {
          session: {
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            expires_at: data.session?.expires_at,
            expires_in: data.session?.expires_in,
          },
          user: data.user
        };
        break;
        
      case "logout":
        console.log("AUTH EDGE FUNCTION: Processing logout request");
        try {
          const { error: logoutError } = await supabase.auth.admin.signOut({
            scope: 'global'
          });
          
          if (logoutError) {
            console.error("AUTH EDGE FUNCTION: Logout error", logoutError);
            throw logoutError;
          }
          
          result = { success: true };
          console.log("AUTH EDGE FUNCTION: Logout successful");
        } catch (logoutError) {
          console.error("AUTH EDGE FUNCTION: Logout error", logoutError);
          throw logoutError;
        }
        break;
        
      default:
        console.error("AUTH EDGE FUNCTION: Unsupported action", action);
        throw new Error(`Action non supportée: ${action}`);
    }

    // Renvoyer le résultat de l'opération
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error("AUTH EDGE FUNCTION: Error", error);
    
    // Mask any sensitive URLs in error messages
    const safeErrorMessage = error.message?.replace(/https:\/\/[^\/]+\.supabase\.co/g, "***");
    
    return new Response(
      JSON.stringify({ 
        error: safeErrorMessage || "Erreur d'authentification" 
      }),
      { headers: corsHeaders, status: error.status || 400 }
    );
  }
});
