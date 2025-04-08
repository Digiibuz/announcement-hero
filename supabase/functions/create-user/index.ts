
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

    // Test database connection first to ensure connectivity
    try {
      console.log("Test de connexion à la base de données...");
      const { data: dbTest, error: dbTestError } = await supabaseAdmin
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1);
      
      if (dbTestError) {
        console.error("Échec de connexion à la base de données:", dbTestError);
        return new Response(
          JSON.stringify({ 
            error: "Problème de connexion à la base de données", 
            details: dbTestError.message 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      console.log("Connexion à la base de données réussie");
    } catch (dbConnErr) {
      console.error("Erreur critique lors du test de connexion:", dbConnErr);
      return new Response(
        JSON.stringify({ 
          error: "Erreur critique de connexion à la base de données", 
          details: dbConnErr.message 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

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

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Log data being used to create user
    console.log("Tentative de création d'utilisateur avec:", {
      email: normalizedEmail,
      password: "******", // Don't log the actual password
      name,
      role,
      wordpressConfigId: wordpressConfigId || null
    });

    // First check if user exists in auth.users (this is often more reliable)
    try {
      console.log("Vérification si l'email existe dans auth.users:", normalizedEmail);
      const { data: userList, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        filters: {
          email: normalizedEmail
        }
      });
      
      if (userError) {
        console.error("Erreur lors de la vérification de l'utilisateur:", userError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification de l'utilisateur" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      if (userList && userList.users.length > 0) {
        console.log("L'email existe déjà dans auth.users:", userList.users);
        return new Response(
          JSON.stringify({ 
            error: "L'utilisateur existe déjà", 
            details: "Cet email est déjà utilisé dans le système."
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409, // Using 409 Conflict for this case
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'utilisateur:", error);
      // Continue despite this error - this is just a pre-check
    }

    // Also check if email exists in the profiles table - case insensitive
    try {
      console.log("Vérification si l'email existe dans la table profiles:", normalizedEmail);
      const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', normalizedEmail);
        
      if (profilesError) {
        console.error("Erreur lors de la vérification du profil existant:", profilesError);
        return new Response(
          JSON.stringify({ error: "Erreur de base de données" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("L'email existe déjà dans la table profiles:", existingProfiles);
        return new Response(
          JSON.stringify({ 
            error: "L'utilisateur existe déjà", 
            details: "Cet email est déjà utilisé dans le système."
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
        JSON.stringify({ error: "Erreur de base de données" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Create the user in auth.users with specific error handling
    console.log("Tentative de création de l'utilisateur dans auth.users:", normalizedEmail);
    let newUserData;
    try {
      // Create user with a detailed try/catch to capture all potential issues
      try {
        const createUserResult = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
          }
        });

        if (createUserResult.error) {
          throw createUserResult.error;
        }
        
        newUserData = createUserResult.data;
      } catch (authError) {
        // Log the complete error object for debugging
        console.error("Erreur détaillée lors de la création dans auth:", JSON.stringify(authError, null, 2));
        
        const errorMessage = authError.message || "Erreur lors de la création de l'utilisateur";
        
        // Improved error handling with specific conditions
        if (errorMessage.includes("duplicate key") || errorMessage.includes("already registered") || 
            errorMessage.includes("User already registered")) {
          return new Response(
            JSON.stringify({ 
              error: "Cet email est déjà utilisé", 
              details: "Un utilisateur avec cet email existe déjà dans le système."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 409,
            }
          );
        }
        
        if (errorMessage.includes("invalid_password")) {
          return new Response(
            JSON.stringify({ 
              error: "Mot de passe invalide", 
              details: "Le mot de passe doit respecter les critères de sécurité (min. 6 caractères)."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        
        if (errorMessage.includes("invalid_email")) {
          return new Response(
            JSON.stringify({ 
              error: "Email invalide", 
              details: "Veuillez fournir une adresse email valide."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        
        // Database-specific error
        if (errorMessage.includes("Database error") || authError.status === 500) {
          console.error("Database error with status:", authError.status, "Code:", authError.code);
          return new Response(
            JSON.stringify({ 
              error: "Erreur de base de données lors de la création de l'utilisateur", 
              details: "Détails: " + errorMessage + " (Code: " + (authError.code || "inconnu") + ")"
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            }
          );
        }
        
        // Default error case
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: `Code d'erreur: ${authError.status || 500}, Type: ${authError.name || "Inconnu"}`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: authError.status || 500,
          }
        );
      }
      
      if (!newUserData || !newUserData.user) {
        throw new Error("Échec de création de l'utilisateur: Aucune donnée retournée");
      }
      
      console.log("Utilisateur créé dans auth.users avec succès:", newUserData.user.id);
    } catch (error) {
      console.error("Erreur critique lors de la création dans auth:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la création de l'utilisateur",
          details: "Erreur critique: " + (error.message || "Inconnu")
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Try to create the profile
    try {
      console.log("Création du profil pour l'utilisateur:", newUserData.user.id);
      const profileData = {
        id: newUserData.user.id,
        email: normalizedEmail,
        name: name,
        role: role,
      };
      
      // Add wordpress_config_id only for client role
      if (role === "client" && wordpressConfigId) {
        profileData.wordpress_config_id = wordpressConfigId;
      }
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error("Erreur lors de la création du profil:", profileError);
        
        // If profile creation fails, delete the auth user to maintain consistency
        try {
          console.log("Suppression de l'utilisateur après échec de création de profil:", newUserData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(newUserData.user.id);
        } catch (deleteError) {
          console.error("Erreur lors de la suppression de l'utilisateur après échec:", deleteError);
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de la création du profil utilisateur",
            details: profileError.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
      
      // Try to delete the auth user to maintain consistency
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserData.user.id);
      } catch (deleteError) {
        console.error("Erreur lors de la suppression de l'utilisateur après échec:", deleteError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: error.message || "Erreur lors de la création du profil",
          details: "Une erreur inattendue est survenue" 
        }),
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
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue",
        details: "Erreur non gérée dans la fonction"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
