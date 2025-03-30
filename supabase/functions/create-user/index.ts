
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Démarrage de la fonction create-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { email, password, name, role, clientId, wordpressConfigId } = requestData;

    // Vérifier les données requises
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

    // Vérifier si l'utilisateur existe déjà
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
      console.log("L'utilisateur existe déjà:", email);
      return new Response(
        JSON.stringify({ error: "L'utilisateur existe déjà" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Créer l'utilisateur
    console.log("Création de l'utilisateur:", email);
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        clientId: role === "editor" ? clientId : null,
        wordpressConfigId: role === "editor" ? wordpressConfigId : null,
      },
    });

    if (createError) {
      console.log("Erreur lors de la création de l'utilisateur:", createError.message);
      throw createError;
    }

    // Après avoir créé l'utilisateur dans Auth, créer son profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserData.user.id,
        email: email,
        name: name,
        role: role,
        client_id: role === "editor" ? clientId : null,
        wordpress_config_id: role === "editor" ? wordpressConfigId : null,
      })
      .select()
      .single();

    if (profileError) {
      console.log("Erreur lors de la création du profil:", profileError.message);
      
      // Si la création du profil échoue, supprimer l'utilisateur pour éviter les incohérences
      await supabaseAdmin.auth.admin.deleteUser(newUserData.user.id);
      
      throw profileError;
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
    console.error("Erreur:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
