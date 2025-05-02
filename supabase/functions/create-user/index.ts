import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[create-user] Requête OPTIONS CORS reçue");
    return handleCorsOptions();
  }

  try {
    console.log("[create-user] Démarrage de la fonction create-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[create-user] Client Supabase initialisé");

    // Récupérer les données de la requête
    let requestData;
    let requestBody = "";
    try {
      requestBody = await req.text();
      console.log("[create-user] Corps de la requête brut:", requestBody);
      
      requestData = JSON.parse(requestBody);
      console.log("[create-user] Données reçues (parsées):", JSON.stringify(requestData, null, 2));
    } catch (error) {
      console.error("[create-user] Erreur lors de l'analyse des données JSON:", error);
      console.error("[create-user] Corps de la requête problématique:", requestBody);
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

    console.log("[create-user] Données extraites:");
    console.log(`[create-user] - email: ${email}`);
    console.log(`[create-user] - name: ${name}`);
    console.log(`[create-user] - role: ${role}`);
    console.log(`[create-user] - wordpressConfigId: ${wordpressConfigId}`);
    console.log(`[create-user] - password: ${"*".repeat(password?.length || 0)}`);

    // Vérifier les données requises
    if (!email || !password || !name || !role) {
      console.log("[create-user] Données requises manquantes");
      console.log("[create-user] Champs reçus:", Object.keys(requestData).join(", "));
      
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

    try {
      // Check if email exists in auth.users
      console.log("[create-user] Vérification si l'utilisateur existe dans auth.users:", email);
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email,
        },
      });

      if (searchError) {
        console.log("[create-user] Erreur lors de la recherche d'utilisateurs existants:", searchError.message);
        throw searchError;
      }

      console.log("[create-user] Résultat de la recherche dans auth.users:", JSON.stringify(existingUsers, null, 2));
      console.log("[create-user] Structure de existingUsers:", Object.keys(existingUsers || {}));
      console.log("[create-user] Type de existingUsers:", typeof existingUsers);
      console.log("[create-user] existingUsers.users existe:", existingUsers && Array.isArray(existingUsers.users));
      console.log("[create-user] Longueur de existingUsers.users:", existingUsers?.users?.length || 0);
      
      if (existingUsers?.users) {
        for (let i = 0; i < existingUsers.users.length; i++) {
          console.log(`[create-user] User #${i + 1}:`, JSON.stringify(existingUsers.users[i], null, 2));
        }
      }

      // CORRECTION: Vérifier si un utilisateur avec l'email spécifique existe
      let foundExistingUser = false;
      if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
        for (const user of existingUsers.users) {
          // Vérification explicite que l'email correspond
          if (user.email === email) {
            console.log("[create-user] L'utilisateur existe déjà dans auth.users:", email, "ID:", user.id);
            existingUser = user;
            foundExistingUser = true;
            break;
          }
        }
        
        if (!foundExistingUser) {
          console.log("[create-user] Aucun utilisateur trouvé dans auth.users pour l'email:", email);
        }
      } else {
        console.log("[create-user] Aucun utilisateur trouvé dans auth.users");
      }
      
      // Continuer le processus uniquement si nous avons trouvé un utilisateur correspondant à l'email
      if (foundExistingUser && existingUser) {
        // Check if the user exists in the profiles table
        const { data: existingProfiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id);
          
        if (profilesError) {
          console.error("[create-user] Erreur lors de la vérification du profil existant:", profilesError);
        }
        
        console.log("[create-user] Résultat de la recherche dans profiles:", JSON.stringify(existingProfiles, null, 2));
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log("[create-user] L'utilisateur existe également dans la table profiles:", JSON.stringify(existingProfiles, null, 2));
          return new Response(
            JSON.stringify({ 
              error: "L'utilisateur existe déjà", 
              details: "L'email est déjà utilisé dans le système d'authentification",
              authUser: existingUser.id,
              profileExists: true
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        } else {
          console.log("[create-user] L'utilisateur existe dans auth.users mais PAS dans la table profiles. Tentative de réparation.");
          isPartiallyCreated = true;
        }
      }
      
      // Also check if the email exists in the profiles table but not in auth.users
      if (!isPartiallyCreated && !existingUser) {
        console.log("[create-user] Vérification si l'email existe dans la table profiles:", email);
        const { data: existingProfiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email);
          
        if (profilesError) {
          console.error("[create-user] Erreur lors de la vérification du profil existant:", profilesError);
          throw profilesError;
        }
        
        console.log("[create-user] Résultat de la recherche dans profiles par email:", JSON.stringify(existingProfiles, null, 2));
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log("[create-user] L'email existe déjà dans la table profiles mais pas dans auth.users:", JSON.stringify(existingProfiles, null, 2));
          return new Response(
            JSON.stringify({ 
              error: "L'utilisateur existe déjà", 
              details: "L'email est déjà utilisé dans la table des profils",
              profileId: existingProfiles[0].id
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
    } catch (error) {
      console.error("[create-user] Erreur lors de la vérification d'utilisateur existant:", error);
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
      console.log("[create-user] Réparation d'un utilisateur partiellement créé:", existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Create a new user in auth.users
      console.log("[create-user] Création d'un nouvel utilisateur dans auth.users:", email);
      try {
        const createUserData = {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
          },
        };
        console.log("[create-user] Données pour création d'utilisateur:", JSON.stringify(createUserData, null, 2));
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser(createUserData);

        if (error) {
          console.log("[create-user] Erreur lors de la création de l'utilisateur:", error.message);
          throw error;
        }
        
        userData = data;
        console.log("[create-user] Utilisateur créé avec succès dans auth:", userData.user.id);
        console.log("[create-user] Détails de l'utilisateur créé:", JSON.stringify(userData, null, 2));
      } catch (error) {
        console.error("[create-user] Erreur lors de la création de l'utilisateur:", error);
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
      console.log("[create-user] Création/mise à jour du profil pour l'utilisateur:", userData.user.id);
      
      // Handle WordPress config ID properly
      let wordpress_config_id = null;
      if (role === "client" && wordpressConfigId && wordpressConfigId !== "" && wordpressConfigId !== "none") {
        wordpress_config_id = wordpressConfigId;
        console.log("[create-user] WordPress config ID défini:", wordpress_config_id);
      } else {
        console.log("[create-user] Pas de WordPress config ID ou valeur invalide:", wordpressConfigId);
      }
      
      // Check if profile already exists
      console.log("[create-user] Vérification si le profil existe déjà pour l'ID:", userData.user.id);
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {  // PGRST116 = not found
        console.error("[create-user] Erreur lors de la vérification du profil:", profileCheckError);
      }
      
      console.log("[create-user] Résultat de la vérification de profil:", JSON.stringify(existingProfile, null, 2));
      
      if (existingProfile) {
        console.log("[create-user] Le profil existe déjà, mise à jour:", existingProfile.id);
        const profileData = {
          email: email,
          name: name,
          role: role,
          wordpress_config_id: wordpress_config_id,
          updated_at: new Date()
        };
        
        console.log("[create-user] Données de mise à jour du profil:", JSON.stringify(profileData, null, 2));
        
        const { error: updateError, data: updateResult } = await supabaseAdmin
          .from('profiles')
          .update(profileData)
          .eq('id', userData.user.id);

        if (updateError) {
          console.error("[create-user] Erreur lors de la mise à jour du profil:", updateError);
          throw updateError;
        }
        
        console.log("[create-user] Résultat de la mise à jour:", JSON.stringify(updateResult, null, 2));
      } else {
        console.log("[create-user] Création d'un nouveau profil");
        const profileData = {
          id: userData.user.id,
          email: email,
          name: name,
          role: role,
          wordpress_config_id: wordpress_config_id,
        };
        
        console.log("[create-user] Données de création du profil:", JSON.stringify(profileData, null, 2));
        
        const { error: insertError, data: insertResult } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error("[create-user] Erreur lors de la création du profil:", insertError);
          throw insertError;
        }
        
        console.log("[create-user] Résultat de l'insertion:", JSON.stringify(insertResult, null, 2));
      }
      
      console.log("[create-user] Profil créé/mis à jour avec succès");
    } catch (error) {
      console.error("[create-user] Erreur lors de la gestion du profil:", error);
      
      // Only delete the auth user if we just created it (not during repair)
      if (!isPartiallyCreated) {
        try {
          console.log("[create-user] Suppression de l'utilisateur après échec:", userData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        } catch (deleteError) {
          console.error("[create-user] Erreur lors de la suppression de l'utilisateur après échec:", deleteError);
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

    console.log("[create-user] Utilisateur géré avec succès:", userData.user.id);

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
