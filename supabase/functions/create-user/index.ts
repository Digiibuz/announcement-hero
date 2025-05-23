
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

    // Vérifier si l'utilisateur existe déjà dans l'authentification
    let existingUser = null;
    try {
      console.log("Vérification si l'utilisateur existe dans auth.users:", email);
      const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

      if (searchError) {
        console.error("Erreur lors de la recherche d'utilisateurs existants:", searchError.message);
        throw searchError;
      }

      if (users && users.users) {
        existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
          console.log("L'utilisateur existe déjà dans auth.users:", existingUser.id);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification d'utilisateur existant:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification d'utilisateur existant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    let user = null;

    if (!existingUser) {
      // Create the user in auth.users
      try {
        console.log("Création de l'utilisateur dans auth avec email:", email);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
            wordpressConfigId: role === "client" ? wordpressConfigId : null,
          },
        });

        if (createError) {
          console.error("Erreur lors de la création de l'utilisateur:", createError);
          throw createError;
        }
        
        if (!newUser || !newUser.user) {
          throw new Error("Erreur: L'utilisateur n'a pas été créé correctement");
        }
        
        user = newUser;
        console.log("Utilisateur créé avec succès dans auth:", user.user.id);
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
    } else {
      user = { user: existingUser };
      console.log("Utilisation de l'utilisateur existant:", existingUser.id);
      
      // Update user metadata if needed
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              name,
              role,
              wordpressConfigId: role === "client" ? wordpressConfigId : null,
            },
            password: password,  // Mise à jour du mot de passe
          }
        );
        
        if (updateError) {
          console.log("Erreur lors de la mise à jour des métadonnées:", updateError.message);
          // Non-critical, continue anyway
        } else {
          console.log("Métadonnées utilisateur mises à jour avec succès");
        }
      } catch (error) {
        console.warn("Erreur lors de la mise à jour des métadonnées:", error);
        // Non-critical, continue anyway
      }
    }

    // Check if the profile already exists
    let profileExists = false;
    try {
      if (user && user.user && user.user.id) {
        console.log("Vérification si le profil existe pour l'utilisateur:", user.user.id);
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Erreur lors de la vérification du profil:", profileError);
        } else if (existingProfile) {
          profileExists = true;
          console.log("Le profil existe déjà:", existingProfile.id);
          
          // Update the existing profile
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              email: email,
              name: name,
              role: role,
              wordpress_config_id: role === "client" ? wordpressConfigId : null,
            })
            .eq('id', user.user.id);
            
          if (updateError) {
            console.error("Erreur lors de la mise à jour du profil:", updateError);
          } else {
            console.log("Profil mis à jour avec succès");
          }
        }
      } else {
        console.error("Données utilisateur manquantes pour vérifier le profil");
        throw new Error("Données utilisateur manquantes");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du profil:", error);
      // Non-critical, continue anyway
    }

    // Create profile if it doesn't exist
    if (!profileExists) {
      try {
        if (user && user.user && user.user.id) {
          console.log("Création du profil pour l'utilisateur:", user.user.id);
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: user.user.id,
              email: email,
              name: name,
              role: role,
              wordpress_config_id: role === "client" ? wordpressConfigId : null,
            });

          if (profileError) {
            console.error("Erreur lors de la création du profil:", profileError);
            throw profileError;
          }
          
          console.log("Profil créé avec succès");
        } else {
          console.error("Données utilisateur manquantes pour créer le profil");
          throw new Error("Données utilisateur manquantes");
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
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user.user,
        isNewUser: !existingUser,
        message: existingUser 
          ? "Utilisateur existant mis à jour" 
          : "Nouvel utilisateur créé avec succès" 
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
