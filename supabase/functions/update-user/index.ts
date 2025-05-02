
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  try {
    console.log("Démarrage de la fonction update-user");
    
    // Créer un client Supabase avec la clé de service de façon sécurisée
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { userId, email, name, role, wordpressConfigId } = requestData;

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

    // Déterminer si wordpressConfigId doit être utilisé
    const needsWordPressConfig = role === "client";

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
            wordpressConfigId: needsWordPressConfig ? wordpressConfigId : null,
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
            wordpressConfigId: needsWordPressConfig ? wordpressConfigId : null,
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
    // Utilise notre système de gestion d'erreurs sécurisé
    return errorResponse(error);
  }
});
