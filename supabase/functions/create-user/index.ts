
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

    // ***** PREMIÈRE VÉRIFICATION: Check if the user already exists in Auth *****
    console.log("Vérification si l'utilisateur existe dans auth.users:", email);
    try {
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email,
        },
      });

      if (searchError) {
        console.error("Erreur lors de la recherche d'utilisateurs existants:", searchError.message);
        throw searchError;
      }

      if (existingUsers && existingUsers.users.length > 0) {
        console.log("L'utilisateur existe déjà dans auth.users:", email);
        
        // ***** DEUXIÈME VÉRIFICATION: Check if the user exists in the profiles table *****
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
          console.log("L'utilisateur existe dans auth.users mais PAS dans la table profiles. Création du profil manquant.");
          try {
            // Create profile for existing auth user
            const { error: profileCreateError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: existingUsers.users[0].id,
                email: email,
                name: name,
                role: role,
                wordpress_config_id: role === "client" && wordpressConfigId && wordpressConfigId !== "none" ? wordpressConfigId : null,
              });

            if (profileCreateError) {
              console.error("Erreur lors de la création du profil pour utilisateur existant:", profileCreateError);
              throw profileCreateError;
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                user: existingUsers.users[0],
                message: "Profil créé pour l'utilisateur existant"
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              }
            );
          } catch (error) {
            console.error("Erreur lors de la création du profil pour utilisateur existant:", error);
            return new Response(
              JSON.stringify({ error: error.message || "Erreur lors de la création du profil" }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
              }
            );
          }
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
    
    // Also check if the email exists in the profiles table
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

    // ***** CRÉATION DE L'UTILISATEUR DANS AUTH *****
    console.log("Création de l'utilisateur dans auth:", email);
    let newUserData;
    try {
      // Créer l'utilisateur dans le système d'authentification en utilisant createUser au lieu de admin.createUser
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmer l'email automatiquement
        user_metadata: {
          name,
          role,
          wordpressConfigId: role === "client" && wordpressConfigId && wordpressConfigId !== "none" ? wordpressConfigId : null,
        },
      });

      if (error) {
        console.error("Erreur lors de la création de l'utilisateur dans auth:", error.message);
        throw error;
      }
      
      if (!data || !data.user || !data.user.id) {
        console.error("Pas d'ID utilisateur reçu après création dans auth");
        throw new Error("La création de l'utilisateur n'a pas retourné d'ID utilisateur valide");
      }
      
      newUserData = data;
      console.log("Utilisateur créé avec succès dans auth:", newUserData.user.id);
      
      // ***** VÉRIFIER QUE L'UTILISATEUR A BIEN ÉTÉ CRÉÉ DANS AUTH *****
      const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(newUserData.user.id);
      
      if (verifyError) {
        console.error("Erreur lors de la vérification de l'utilisateur:", verifyError.message);
        throw verifyError;
      }
      
      if (!verifyUser || !verifyUser.user) {
        console.error("L'utilisateur n'a pas été trouvé après sa création");
        throw new Error("Échec de vérification de la création de l'utilisateur dans auth");
      }
      
      console.log("Utilisateur vérifié dans auth:", verifyUser.user.id);
      
    } catch (error) {
      console.error("Erreur critique lors de la création de l'utilisateur dans auth:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message || "Erreur lors de la création de l'utilisateur", 
          details: "Impossible de créer l'utilisateur dans le système d'authentification" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // ***** CRÉATION DU PROFIL POUR L'UTILISATEUR *****
    try {
      console.log("Création du profil pour l'utilisateur:", newUserData.user.id);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUserData.user.id,
          email: email,
          name: name,
          role: role,
          wordpress_config_id: role === "client" && wordpressConfigId && wordpressConfigId !== "none" ? wordpressConfigId : null,
        });

      if (profileError) {
        console.error("Erreur lors de la création du profil:", profileError.message);
        
        // If profile creation fails, delete the user to avoid inconsistencies
        try {
          console.log("Suppression de l'utilisateur après échec de création de profil:", newUserData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(newUserData.user.id);
        } catch (deleteError) {
          console.error("Erreur lors de la suppression de l'utilisateur après échec de création de profil:", deleteError);
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

    console.log("Utilisateur et profil créés avec succès:", newUserData.user.id);

    // ***** VÉRIFICATION FINALE QUE TOUT EST CRÉÉ CORRECTEMENT *****
    try {
      const { data: finalAuth } = await supabaseAdmin.auth.admin.getUserById(newUserData.user.id);
      console.log("Vérification finale utilisateur auth:", finalAuth ? "OK" : "NON TROUVÉ");
      
      const { data: finalProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', newUserData.user.id)
        .single();
        
      console.log("Vérification finale du profil créé:", finalProfile ? "OK" : "NON TROUVÉ");
    } catch (error) {
      console.log("Erreur lors de la vérification finale (non bloquante):", error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUserData.user,
        message: "Utilisateur créé avec succès dans le système d'authentification et la table des profils"
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
