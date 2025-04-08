
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Récupération des variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Vérification de la présence des variables d'environnement nécessaires
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Variables d'environnement manquantes");
      return new Response(
        JSON.stringify({
          error: "Configuration du serveur incomplète",
          details: "Veuillez contacter l'administrateur"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Création du client Supabase avec la clé de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Test de connexion à la base de données
    try {
      const { error: testError } = await supabaseAdmin
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1);
      
      if (testError) {
        console.error("Erreur de connexion à la base de données:", testError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur de connexion à la base de données", 
            details: testError.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } catch (dbError) {
      console.error("Exception lors du test de connexion:", dbError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur critique de connexion", 
          details: dbError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Récupération des données de la requête
    const { email, password, name, role, wordpressConfigId } = await req.json();

    // Validation des données obligatoires
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ 
          error: "Données incomplètes",
          details: "Email, mot de passe, nom et rôle sont obligatoires" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Normalisation de l'email
    const normalizedEmail = email.toLowerCase().trim();

    // Vérification de l'existence de l'email
    const { data: existingUsers, error: emailCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail);
      
    if (emailCheckError) {
      console.error("Erreur lors de la vérification d'email:", emailCheckError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la vérification d'email",
          details: emailCheckError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Cet email est déjà utilisé",
          details: "Veuillez utiliser un autre email" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        }
      );
    }

    // Création de l'utilisateur
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      }
    });

    if (createUserError) {
      console.error("Erreur lors de la création de l'utilisateur:", createUserError);
      
      if (createUserError.message?.includes("already registered")) {
        return new Response(
          JSON.stringify({ 
            error: "Cet email est déjà utilisé", 
            details: "Un utilisateur avec cet email existe déjà" 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la création de l'utilisateur",
          details: createUserError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!authUser || !authUser.user) {
      return new Response(
        JSON.stringify({ 
          error: "Échec de la création de l'utilisateur",
          details: "Aucune donnée retournée" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Création du profil utilisateur
    const profileData = {
      id: authUser.user.id,
      email: normalizedEmail,
      name,
      role,
    };
    
    // Ajout du wordpress_config_id pour les clients
    if (role === "client" && wordpressConfigId) {
      profileData.wordpress_config_id = wordpressConfigId;
    }
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error("Erreur lors de la création du profil:", profileError);
      
      // Suppression de l'utilisateur si la création du profil échoue
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      } catch (deleteError) {
        console.error("Erreur lors de la suppression après échec:", deleteError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la création du profil",
          details: profileError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Réponse réussie
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user.id,
          email: normalizedEmail,
          name,
          role
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur non gérée:", error);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur inattendue est survenue",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
