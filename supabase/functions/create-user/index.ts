
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Démarrage de la fonction create-user");
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request data
    let requestData;
    try {
      requestData = await req.json();
      console.log("Données reçues:", JSON.stringify(requestData));
    } catch (error) {
      console.error("Erreur lors de l'analyse des données JSON:", error);
      return new Response(
        JSON.stringify({ error: "Format de données invalide" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const { email, password, name, role, wordpressConfigId } = requestData;

    // Check required data
    if (!email || !password || !name || !role) {
      console.log("Données requises manquantes");
      return new Response(
        JSON.stringify({ error: "Données requises manquantes" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if the user already exists
    let existingUser = null;
    let isPartiallyCreated = false;

    try {
      // Check if email exists in auth.users
      console.log("Vérification si l'utilisateur existe dans auth.users:", email);
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email,
        },
      });

      if (searchError) {
        console.log("Erreur lors de la recherche d'utilisateurs existants:", searchError.message);
        throw searchError;
      }

      if (existingUsers && existingUsers.users.length > 0) {
        console.log("L'utilisateur existe déjà dans auth.users:", email);
        existingUser = existingUsers.users[0];
        
        // Check if the user exists in the profiles table
        const { data: existingProfiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id);
          
        if (profilesError) {
          console.error("Erreur lors de la vérification du profil existant:", profilesError);
        }
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log("L'utilisateur existe également dans la table profiles:", existingProfiles);
          return new Response(
            JSON.stringify({ 
              error: "L'utilisateur existe déjà", 
              details: "L'email est déjà utilisé dans le système d'authentification"
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        } else {
          console.log("L'utilisateur existe dans auth.users mais PAS dans la table profiles. Tentative de réparation.");
          isPartiallyCreated = true;
        }
      }
      
      // Also check if the email exists in the profiles table but not in auth.users
      if (!isPartiallyCreated && !existingUser) {
        console.log("Vérification si l'email existe dans la table profiles:", email);
        const { data: existingProfiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email);
          
        if (profilesError) {
          console.error("Erreur lors de la vérification du profil existant:", profilesError);
          throw profilesError;
        }
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log("L'email existe déjà dans la table profiles mais pas dans auth.users:", existingProfiles);
          return new Response(
            JSON.stringify({ 
              error: "L'utilisateur existe déjà", 
              details: "L'email est déjà utilisé dans la table des profils"
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification d'utilisateur existant:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Erreur lors de la vérification d'utilisateur existant" }),
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
      console.log("Réparation d'un utilisateur partiellement créé:", existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Create a new user in auth.users
      console.log("Création d'un nouvel utilisateur dans auth.users:", email);
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
          },
        });

        if (error) {
          console.log("Erreur lors de la création de l'utilisateur:", error.message);
          throw error;
        }
        
        userData = data;
        console.log("Utilisateur créé avec succès dans auth:", userData.user.id);
      } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Erreur lors de la création de l'utilisateur" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    // Create or update the user profile
    try {
      console.log("Création/mise à jour du profil pour l'utilisateur:", userData.user.id);
      
      // Handle WordPress config ID properly
      let wordpress_config_id = null;
      if (role === "client" && wordpressConfigId && wordpressConfigId !== "" && wordpressConfigId !== "none") {
        wordpress_config_id = wordpressConfigId;
        console.log("WordPress config ID défini:", wordpress_config_id);
      } else {
        console.log("Pas de WordPress config ID ou valeur invalide");
      }
      
      // Check if profile already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .single();
      
      if (existingProfile) {
        console.log("Le profil existe déjà, mise à jour:", existingProfile.id);
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            email: email,
            name: name,
            role: role,
            wordpress_config_id: wordpress_config_id,
            updated_at: new Date()
          })
          .eq('id', userData.user.id);

        if (updateError) {
          console.error("Erreur lors de la mise à jour du profil:", updateError);
          throw updateError;
        }
      } else {
        console.log("Création d'un nouveau profil");
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userData.user.id,
            email: email,
            name: name,
            role: role,
            wordpress_config_id: wordpress_config_id,
          });

        if (insertError) {
          console.error("Erreur lors de la création du profil:", insertError);
          throw insertError;
        }
      }
      
      console.log("Profil créé/mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la gestion du profil:", error);
      
      // Only delete the auth user if we just created it (not during repair)
      if (!isPartiallyCreated) {
        try {
          console.log("Suppression de l'utilisateur après échec:", userData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        } catch (deleteError) {
          console.error("Erreur lors de la suppression de l'utilisateur après échec:", deleteError);
        }
      }
      
      return new Response(
        JSON.stringify({ error: error.message || "Erreur lors de la création/mise à jour du profil" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Utilisateur géré avec succès:", userData.user.id);

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
    console.error("Erreur non gérée:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
