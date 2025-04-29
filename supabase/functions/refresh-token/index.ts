
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// En-têtes CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    // Variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

    // Création du client Supabase avec la clé de service
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupérer le refresh_token du corps de la requête
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: "Refresh token requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rafraîchir le token avec Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    // En cas d'erreur de rafraîchissement
    if (error) {
      console.error("Erreur lors du rafraîchissement du token (détails masqués)");
      
      return new Response(
        JSON.stringify({ error: "Impossible de rafraîchir le token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retour des nouveaux tokens
    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // Masquer les détails de l'erreur
    const safeErrorMessage = sanitizeErrorMessage(String(err));
    console.error("Erreur dans l'Edge Function refresh-token:", safeErrorMessage);
    
    return new Response(
      JSON.stringify({ error: "Erreur lors du rafraîchissement du token" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
