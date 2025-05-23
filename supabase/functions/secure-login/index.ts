
// secure-login/index.ts
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
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Tentative de connexion sécurisée pour ${email}`);

    // Vérifier d'abord les identifiants avec le mot de passe d'origine
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log(`Échec de l'authentification: ${signInError.message}`);
      return new Response(
        JSON.stringify({ error: signInError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Authentification réussie, générer un suffixe aléatoire
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newPassword = `${password}${randomSuffix}`;
    
    console.log(`Connexion réussie pour ${email}, mise à jour du mot de passe avec suffixe`);

    // Mettre à jour le mot de passe avec le nouveau suffixe
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      signInData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.log(`Échec de la mise à jour du mot de passe: ${updateError.message}`);
      // Si la mise à jour échoue, la connexion est toujours valide, donc on ne renvoie pas d'erreur
      // On retourne simplement le token JWT de la connexion réussie
      return new Response(
        JSON.stringify({ 
          user: signInData.user,
          session: signInData.session,
          passwordUpdated: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Retourner les informations de session au client
    return new Response(
      JSON.stringify({ 
        user: signInData.user, 
        session: signInData.session,
        passwordUpdated: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`Erreur de traitement: ${error.message}`);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue lors de la connexion" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
