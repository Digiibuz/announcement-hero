
// secure-login/index.ts
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
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Get request data
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

    // ÉTAPE 1: D'abord vérifier les identifiants avec le mot de passe original
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    // Si l'authentification échoue, retourner immédiatement l'erreur
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

    // S'assurer que nous avons des données utilisateur valides avant de continuer
    if (!signInData?.user || !signInData?.session) {
      console.log("Authentification réussie mais données utilisateur invalides");
      return new Response(
        JSON.stringify({ error: "Données d'authentification invalides" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // ÉTAPE 2: L'authentification est réussie, générer un suffixe aléatoire
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newPassword = `${password}${randomSuffix}`;
    
    console.log(`Connexion réussie pour ${email}, mise à jour du mot de passe avec suffixe`);

    // ÉTAPE 3: Mettre à jour le mot de passe avec le nouveau suffixe
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        signInData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.log(`Échec de la mise à jour du mot de passe: ${updateError.message}`);
        // Si la mise à jour échoue, la connexion est toujours valide
        // Retourner simplement le jeton JWT de la connexion réussie
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

      // ÉTAPE 4: Retourner les informations de session au client
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
    } catch (updateError) {
      console.error(`Erreur lors de la mise à jour du mot de passe: ${updateError.message}`);
      // Retourner la session originale si la mise à jour du mot de passe échoue
      return new Response(
        JSON.stringify({ 
          user: signInData.user, 
          session: signInData.session,
          passwordUpdated: false,
          updateError: updateError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
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
