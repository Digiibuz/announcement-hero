
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// En-têtes CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Fonction principale qui traite les requêtes
serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Récupération des variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Vérification de la présence des variables d'environnement
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement manquantes");
      return new Response(
        JSON.stringify({ error: "Configuration du serveur incorrecte" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Création du client Supabase avec la clé SERVICE_ROLE
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "edge-function-login",
        },
      },
    });

    // Parsing du corps de la requête
    const { email, password } = await req.json();

    // Vérification des champs requis
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Tentative d'authentification avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // En cas d'erreur d'authentification
    if (error) {
      // Masquage des détails sensibles dans les messages d'erreur
      console.error("Erreur d'authentification (détails masqués)");
      
      // Ne jamais exposer l'erreur brute
      return new Response(
        JSON.stringify({ error: "Identifiants invalides" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Authentification réussie, retourner les tokens et infos utilisateur
    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: data.user?.role,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // Gestion des erreurs générales
    const safeErrorMessage = sanitizeErrorMessage(String(err));
    console.error("Erreur dans l'Edge Function login:", safeErrorMessage);
    
    return new Response(
      JSON.stringify({ error: "Erreur lors de la connexion" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
