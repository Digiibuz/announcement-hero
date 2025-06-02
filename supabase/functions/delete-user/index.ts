
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
    console.log("Démarrage de la fonction delete-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { userId } = requestData;

    // Vérifier les données requises
    if (!userId) {
      console.log("ID utilisateur manquant");
      return new Response(
        JSON.stringify({ error: "ID utilisateur manquant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 1. Supprimer les limites mensuelles de publication
    console.log("Suppression des limites de publication pour l'utilisateur:", userId);
    const { error: publicationLimitsError } = await supabaseAdmin
      .from('monthly_publication_limits')
      .delete()
      .eq('user_id', userId);

    if (publicationLimitsError) {
      console.log("Erreur lors de la suppression des limites de publication:", publicationLimitsError.message);
      throw publicationLimitsError;
    }

    // 2. Supprimer les limites mensuelles d'IA
    console.log("Suppression des limites d'IA pour l'utilisateur:", userId);
    const { error: aiLimitsError } = await supabaseAdmin
      .from('monthly_ai_limits')
      .delete()
      .eq('user_id', userId);

    if (aiLimitsError) {
      console.log("Erreur lors de la suppression des limites d'IA:", aiLimitsError.message);
      throw aiLimitsError;
    }

    // 3. Supprimer les annonces de l'utilisateur
    console.log("Suppression des annonces pour l'utilisateur:", userId);
    const { error: announcementsError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('user_id', userId);

    if (announcementsError) {
      console.log("Erreur lors de la suppression des annonces:", announcementsError.message);
      throw announcementsError;
    }

    // 4. Supprimer les profils Google Business de l'utilisateur
    console.log("Suppression des profils Google Business pour l'utilisateur:", userId);
    const { error: googleBusinessError } = await supabaseAdmin
      .from('user_google_business_profiles')
      .delete()
      .eq('user_id', userId);

    if (googleBusinessError) {
      console.log("Erreur lors de la suppression des profils Google Business:", googleBusinessError.message);
      throw googleBusinessError;
    }

    // 5. Supprimer l'entrée dans la table profiles
    console.log("Suppression du profil pour l'utilisateur:", userId);
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.log("Erreur lors de la suppression du profil:", profileDeleteError.message);
      throw profileDeleteError;
    }

    // 6. Enfin, supprimer l'utilisateur de l'authentification Supabase
    console.log("Suppression de l'utilisateur dans auth:", userId);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.log("Erreur lors de la suppression de l'utilisateur:", deleteError.message);
      throw deleteError;
    }

    console.log("Utilisateur supprimé avec succès");

    return new Response(
      JSON.stringify({ success: true }),
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
