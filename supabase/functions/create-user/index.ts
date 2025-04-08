
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

    // Check if the user already exists in Auth
    let existingUser = null;
    let isPartiallyCreated = false;

    try {
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
          .eq('email', email);
          
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
          console.log("L'utilisateur existe dans auth.users mais PAS dans la table profiles");
          isPartiallyCreated = true;
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
    
    // Also check if the email exists in the profiles table but not in auth.users
    if (!isPartiallyCreated && !existingUser) {
      try {
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
              details: "L'email est déjà utilisé dans la table des profils mais pas dans le système d'authentification. Incohérence de données détectée."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du profil existant:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Erreur lors de la vérification du profil existant" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    // Si l'utilisateur est partiellement créé (dans auth.users mais pas dans profiles)
    // On crée seulement le profil
    let userData = null;
    if (isPartiallyCreated && existingUser) {
      console.log("Réparation d'un utilisateur partiellement créé:", existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Create the user in auth.users
      console.log("Création de l'utilisateur:", email);
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
            wordpressConfigId: role === "client" ? wordpressConfigId : null,
          },
        });

        if (error) {
          console.log("Erreur lors de la création de l'utilisateur:", error.message);
          throw error;
        }
        
        userData = data;
        console.log("Utilisateur créé dans auth:", userData.user.id);
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

    // After creating the user in Auth or retrieving an existing one, create their profile
    try {
      console.log("Création du profil pour l'utilisateur:", userData.user.id);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userData.user.id,
          email: email,
          name: name,
          role: role,
          wordpress_config_id: role === "client" ? wordpressConfigId : null,
        });

      if (profileError) {
        console.log("Erreur lors de la création du profil:", profileError.message);
        
        // Si c'est un nouvel utilisateur et que la création du profil échoue, on le supprime
        if (!isPartiallyCreated) {
          try {
            console.log("Suppression de l'utilisateur après échec de création de profil:", userData.user.id);
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
          } catch (deleteError) {
            console.error("Erreur lors de la suppression de l'utilisateur après échec de création de profil:", deleteError);
          }
        }
        
        throw profileError;
      }
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Erreur lors de la création du profil" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Utilisateur créé avec succès:", userData.user.id);

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
