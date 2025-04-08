
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fonction pour tester la connexion à la base de données avec retry
async function testDatabaseConnection(supabaseAdmin, maxRetries = 3, retryDelay = 1000) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Tentative de connexion à la base de données (${attempt + 1}/${maxRetries})...`);
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        console.error(`Échec de la tentative ${attempt + 1}:`, error);
        
        // Si c'est la dernière tentative, propager l'erreur
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Sinon, attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
        continue;
      }
      
      console.log("Connexion à la base de données réussie");
      return true;
    } catch (err) {
      console.error(`Erreur critique lors de la tentative ${attempt + 1}:`, err);
      
      if (attempt === maxRetries - 1) {
        throw err;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      attempt++;
    }
  }
  
  throw new Error("Échec de toutes les tentatives de connexion à la base de données");
}

// Fonction pour vérifier l'existence d'un email avec retry
async function checkEmailExists(supabaseAdmin, email, maxRetries = 3, retryDelay = 1000) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Vérification si l'email existe (${attempt + 1}/${maxRetries}):`, email);
      
      // 1. Vérifier dans auth.users
      const { data: userList, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        filters: { email }
      });
      
      if (userError) {
        console.error(`Erreur lors de la vérification dans auth.users (tentative ${attempt + 1}):`, userError);
        
        if (attempt === maxRetries - 1) {
          throw userError;
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
        continue;
      }
      
      if (userList && userList.users.length > 0) {
        console.log("L'email existe déjà dans auth.users");
        return true;
      }
      
      // 2. Vérifier dans profiles
      const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', email);
        
      if (profilesError) {
        console.error(`Erreur lors de la vérification dans profiles (tentative ${attempt + 1}):`, profilesError);
        
        if (attempt === maxRetries - 1) {
          throw profilesError;
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
        continue;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("L'email existe déjà dans profiles");
        return true;
      }
      
      return false;
    } catch (err) {
      console.error(`Erreur critique lors de la vérification d'email (tentative ${attempt + 1}):`, err);
      
      if (attempt === maxRetries - 1) {
        throw err;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      attempt++;
    }
  }
  
  throw new Error("Échec de toutes les tentatives de vérification d'email");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Démarrage de la fonction create-user");
    
    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Variables d'environnement manquantes:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceRoleKey 
      });
      
      return new Response(
        JSON.stringify({
          error: "Configuration serveur incomplète",
          details: "Les variables d'environnement requises sont manquantes"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Test database connection with retry mechanism
    try {
      await testDatabaseConnection(supabaseAdmin);
    } catch (dbConnErr) {
      console.error("Erreur critique de connexion à la base de données:", dbConnErr);
      return new Response(
        JSON.stringify({ 
          error: "Erreur critique de connexion à la base de données", 
          details: dbConnErr?.message || "Échec de connexion à la base de données"
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
        JSON.stringify({ 
          error: "Données requises manquantes",
          details: "Email, mot de passe, nom et rôle sont obligatoires" 
        }),
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

    // Check if email exists (with retry)
    try {
      const emailExists = await checkEmailExists(supabaseAdmin, normalizedEmail);
      if (emailExists) {
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
    } catch (emailCheckError) {
      console.error("Erreur lors de la vérification de l'email:", emailCheckError);
      // Continuer malgré cette erreur pour essayer de créer l'utilisateur quand même
    }

    // Create the user in auth.users with a try-catch for detailed error handling
    console.log("Tentative de création de l'utilisateur dans auth.users:", normalizedEmail);
    let newUserData;
    
    try {
      console.log("Appel à createUser avec:", {
        email: normalizedEmail,
        passwordLength: password ? password.length : 0,
        hasName: !!name,
        hasRole: !!role
      });
      
      // Récupérer le client auth pour des logs détaillés
      const authClient = supabaseAdmin.auth.admin;
      
      // Vérifier que le client auth est disponible
      if (!authClient) {
        throw new Error("Client auth non disponible");
      }
      
      const createUserResult = await authClient.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        }
      });

      if (createUserResult.error) {
        console.error("Erreur détaillée lors de la création dans auth:", 
                     JSON.stringify(createUserResult.error, null, 2));
        throw createUserResult.error;
      }
      
      newUserData = createUserResult.data;
      
      if (!newUserData || !newUserData.user) {
        throw new Error("Échec de création de l'utilisateur: Aucune donnée retournée");
      }
      
      console.log("Utilisateur créé dans auth.users avec succès:", newUserData.user.id);
    } catch (authError) {
      // Log the complete error object for debugging
      console.error("Erreur lors de la création de l'utilisateur dans auth.users:", authError);
      
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
        
        // Ajout de détails sur l'erreur de base de données
        let detailsMessage = "Détails: " + errorMessage;
        
        if (authError.code) {
          detailsMessage += " (Code: " + authError.code + ")";
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Erreur de base de données lors de la création de l'utilisateur", 
            details: detailsMessage
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
