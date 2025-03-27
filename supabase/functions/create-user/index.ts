
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
    
    console.log("Headers reçus:", JSON.stringify(req.headers, null, 2));
    
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
      return new Response(
        JSON.stringify({
          error: "Données manquantes. Email, mot de passe, nom et rôle sont requis."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Créer l'utilisateur
    console.log("Création de l'utilisateur:", email);
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
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

    if (createUserError) {
      console.log("Erreur lors de la création de l'utilisateur:", createUserError.message);
      throw createUserError;
    }

    console.log("Utilisateur créé avec succès:", authUser.user.id);

    // Vérifier si un profil existe déjà pour cet utilisateur
    console.log("Vérification si un profil existe déjà pour:", authUser.user.id);
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authUser.user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.log("Erreur lors de la vérification du profil:", profileCheckError.message);
      throw profileCheckError;
    }

    if (existingProfile) {
      // Mettre à jour le profil existant
      console.log("Profil existant trouvé, mise à jour pour:", authUser.user.id);
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          name,
          email,
          role,
          client_id: role === "editor" ? clientId : null,
          wordpress_config_id: role === "editor" ? wordpressConfigId : null,
        })
        .eq("id", authUser.user.id);

      if (updateError) {
        console.log("Erreur lors de la mise à jour du profil:", updateError.message);
        throw updateError;
      }
      console.log("Profil mis à jour avec succès");
    } else {
      // Créer un nouveau profil
      console.log("Insertion dans la table profiles pour:", authUser.user.id);
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authUser.user.id,
          name,
          email,
          role,
          client_id: role === "editor" ? clientId : null,
          wordpress_config_id: role === "editor" ? wordpressConfigId : null,
        });

      if (insertError) {
        console.log("Erreur lors de l'insertion dans profiles:", insertError.message);
        throw insertError;
      }
      console.log("Profil créé avec succès");
    }

    return new Response(
      JSON.stringify({
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          role,
          name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
