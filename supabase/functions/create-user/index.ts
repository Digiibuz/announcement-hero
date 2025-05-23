
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

    // First check if the email exists in the profiles table
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
        console.log("L'email existe déjà dans la table profiles:", existingProfiles);
        return new Response(
          JSON.stringify({ 
            error: "L'utilisateur existe déjà", 
            details: "L'email est déjà utilisé dans la table des profils."
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

    // Check if the user already exists in Auth
    let existingUser = null;
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
        
        // Si l'utilisateur existe dans auth.users mais pas dans profiles (vérification déjà faite),
        // nous pouvons créer son profil manquant
        console.log("Création du profil manquant pour cet utilisateur existant");
        
        try {
          // Create profile for existing auth user
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: existingUser.id,
              email: email,
              name: name,
              role: role,
              wordpress_config_id: role === "client" ? wordpressConfigId : null,
            });

          if (profileError) {
            console.log("Erreur lors de la création du profil pour l'utilisateur existant:", profileError.message);
            
            // Si l'erreur est due à une violation de la contrainte de clé primaire,
            // essayons de mettre à jour le profil existant au lieu de l'insérer
            if (profileError.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
              const { error: updateProfileError } = await supabaseAdmin
                .from('profiles')
                .update({
                  email: email,
                  name: name,
                  role: role,
                  wordpress_config_id: role === "client" ? wordpressConfigId : null,
                })
                .eq('id', existingUser.id);
                
              if (updateProfileError) {
                console.error("Erreur lors de la mise à jour du profil existant:", updateProfileError);
                throw updateProfileError;
              }
              
              console.log("Profil existant mis à jour pour l'utilisateur:", existingUser.id);
            } else {
              throw profileError;
            }
          } else {
            console.log("Profil créé pour l'utilisateur existant:", existingUser.id);
          }
          
          // Update user metadata in auth
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                name,
                role,
                wordpressConfigId: role === "client" ? wordpressConfigId : null,
              },
            }
          );
          
          if (updateError) {
            console.log("Erreur lors de la mise à jour des métadonnées de l'utilisateur:", updateError.message);
            throw updateError;
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              user: existingUser, 
              message: "Profil recréé ou mis à jour pour l'utilisateur existant" 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (error) {
          console.error("Erreur lors de la gestion du profil pour l'utilisateur existant:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Erreur lors de la gestion du profil pour l'utilisateur existant" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
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

    // Create the user
    console.log("Création de l'utilisateur:", email);
    let newUserData;
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
      
      newUserData = data;
      console.log("Utilisateur créé dans auth:", newUserData.user.id);
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

    // After creating the user in Auth, create their profile
    try {
      console.log("Création du profil pour l'utilisateur:", newUserData.user.id);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUserData.user.id,
          email: email,
          name: name,
          role: role,
          wordpress_config_id: role === "client" ? wordpressConfigId : null,
        });

      if (profileError) {
        console.log("Erreur lors de la création du profil:", profileError.message);
        
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

    console.log("Utilisateur créé avec succès:", newUserData.user.id);

    return new Response(
      JSON.stringify({ success: true, user: newUserData.user }),
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
