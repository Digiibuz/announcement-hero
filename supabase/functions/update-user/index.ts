
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Démarrage de la fonction update-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { userId, email, name, role, clientId, wordpressConfigId } = requestData;

    // Vérifier les données requises
    if (!userId) {
      console.log("ID utilisateur manquant");
      return new Response(
        JSON.stringify({ error: "ID utilisateur manquant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Mettre à jour l'utilisateur dans auth si email est fourni
    if (email) {
      console.log("Mise à jour de l'email:", email);
      const { data: updateAuthData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          email,
          email_confirm: true,
          user_metadata: {
            name,
            role,
            clientId: role === "editor" ? clientId : null,
            wordpressConfigId: role === "editor" ? wordpressConfigId : null,
          }
        }
      );

      if (updateAuthError) {
        console.log("Erreur lors de la mise à jour de l'utilisateur:", updateAuthError.message);
        throw updateAuthError;
      }

      console.log("Utilisateur mis à jour avec succès dans auth");
    } else {
      // Mettre à jour uniquement les métadonnées utilisateur
      const { data: updateMetaData, error: updateMetaError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            name,
            role,
            clientId: role === "editor" ? clientId : null,
            wordpressConfigId: role === "editor" ? wordpressConfigId : null,
          }
        }
      );

      if (updateMetaError) {
        console.log("Erreur lors de la mise à jour des métadonnées:", updateMetaError.message);
        throw updateMetaError;
      }

      console.log("Métadonnées utilisateur mises à jour avec succès");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
