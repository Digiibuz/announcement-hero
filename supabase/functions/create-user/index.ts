
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
    
    // Afficher les en-têtes pour débogage
    console.log("Headers reçus:", Object.fromEntries(req.headers.entries()));
    
    // Créer un client Supabase avec la clé de service (possède des privilèges admin)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { email, name, password, role, clientId } = requestData;

    // Vérifier les données requises
    if (!email || !name || !password || !role) {
      console.log("Données manquantes");
      return new Response(
        JSON.stringify({ error: "Données manquantes: email, nom, mot de passe et rôle sont requis" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Créer l'utilisateur
    console.log("Création de l'utilisateur:", email);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        clientId: role === "editor" ? clientId : null,
      },
    });

    if (createError) {
      console.log("Erreur lors de la création de l'utilisateur:", createError.message);
      throw createError;
    }

    console.log("Utilisateur créé avec succès:", newUser.user?.id);

    // Mettre à jour le profil pour définir le rôle et l'identifiant client
    if (newUser.user) {
      console.log("Mise à jour du profil pour:", newUser.user.id);
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: role,
          client_id: role === "editor" ? clientId : null,
          name: name,
          email: email
        })
        .eq("id", newUser.user.id);

      if (updateError) {
        console.log("Erreur lors de la mise à jour du profil:", updateError.message);
        throw updateError;
      }
      
      console.log("Profil mis à jour avec succès");
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
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
