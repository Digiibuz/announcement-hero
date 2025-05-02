
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";
import { RequestData, CreateUserResponse } from "./types.ts";
import { logger } from "./logger.ts";
import { findExistingUser, createNewUser, createOrUpdateProfile } from "./userManagement.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    logger.log("Requête OPTIONS CORS reçue");
    return handleCorsOptions();
  }

  try {
    logger.log("Démarrage de la fonction create-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logger.log("Client Supabase initialisé");

    // Récupérer les données de la requête
    let requestData: RequestData;
    let requestBody = "";
    try {
      requestBody = await req.text();
      logger.log("Corps de la requête brut:", requestBody);
      
      requestData = JSON.parse(requestBody);
      logger.log("Données reçues (parsées):", JSON.stringify(requestData, null, 2));
    } catch (error) {
      logger.error("Erreur lors de l'analyse des données JSON:", error);
      logger.error("Corps de la requête problématique:", requestBody);
      return new Response(
        JSON.stringify({ 
          error: "Format de données invalide", 
          details: error.message,
          receivedBody: requestBody 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const { email, password, name, role, wordpressConfigId } = requestData;

    logger.log("Données extraites:");
    logger.log(`- email: ${email}`);
    logger.log(`- name: ${name}`);
    logger.log(`- role: ${role}`);
    logger.log(`- wordpressConfigId: ${wordpressConfigId}`);
    logger.log(`- password: ${"*".repeat(password?.length || 0)}`);

    // Vérifier les données requises
    if (!email || !password || !name || !role) {
      logger.log("Données requises manquantes");
      logger.log("Champs reçus:", Object.keys(requestData).join(", "));
      
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!name) missingFields.push("name");
      if (!role) missingFields.push("role");
      
      return new Response(
        JSON.stringify({ 
          error: "Données requises manquantes", 
          details: `Champs manquants: ${missingFields.join(", ")}`,
          receivedFields: Object.keys(requestData)
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    let existingUser = null;
    let isPartiallyCreated = false;
    let profileExists = false;
    let profileId = null;

    try {
      const userCheck = await findExistingUser(supabaseAdmin, email);
      existingUser = userCheck.existingUser;
      isPartiallyCreated = userCheck.isPartiallyCreated;
      profileExists = userCheck.profileExists;
      profileId = userCheck.profileId;
      
      if (profileExists && !isPartiallyCreated) {
        return new Response(
          JSON.stringify({ 
            error: "L'utilisateur existe déjà", 
            details: "L'email est déjà utilisé dans le système d'authentification",
            authUser: existingUser?.id,
            profileExists,
            profileId
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    } catch (error) {
      logger.error("Erreur lors de la vérification d'utilisateur existant:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message || "Erreur lors de la vérification d'utilisateur existant",
          stack: error.stack
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Process user creation or repair
    let userData = null;
    
    // Si l'utilisateur est partiellement créé (dans auth.users mais pas dans profiles)
    if (isPartiallyCreated && existingUser) {
      logger.log("Réparation d'un utilisateur partiellement créé:", existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Create a new user in auth.users
      try {
        userData = await createNewUser(supabaseAdmin, requestData);
      } catch (error) {
        logger.error("Erreur lors de la création de l'utilisateur:", error);
        return new Response(
          JSON.stringify({ 
            error: error.message || "Erreur lors de la création de l'utilisateur",
            stack: error.stack || "Pas de stack trace disponible"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    // Create or update the user profile
    try {
      await createOrUpdateProfile(supabaseAdmin, userData.user.id, requestData);
    } catch (error) {
      logger.error("Erreur lors de la gestion du profil:", error);
      
      // Only delete the auth user if we just created it (not during repair)
      if (!isPartiallyCreated) {
        try {
          logger.log("Suppression de l'utilisateur après échec:", userData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        } catch (deleteError) {
          logger.error("Erreur lors de la suppression de l'utilisateur après échec:", deleteError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: error.message || "Erreur lors de la création/mise à jour du profil",
          details: error.details || error.hint || null,
          stack: error.stack || null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    logger.log("Utilisateur géré avec succès:", userData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: isPartiallyCreated ? "Utilisateur réparé avec succès" : "Utilisateur créé avec succès"
      }),
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
