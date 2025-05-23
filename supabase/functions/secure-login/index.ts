
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

    // First check credentials with the original password - THIS IS CRUCIAL
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    // If authentication fails, return immediately with the error
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

    // Make sure we have valid user data before proceeding
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

    // Authentication successful, generate a random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newPassword = `${password}${randomSuffix}`;
    
    console.log(`Connexion réussie pour ${email}, mise à jour du mot de passe avec suffixe`);

    try {
      // Update password with new suffix
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        signInData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.log(`Échec de la mise à jour du mot de passe: ${updateError.message}`);
        // If update fails, the login is still valid, so we don't return an error
        // Just return the JWT token from the successful login
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

      // Return session information to the client
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
      // Return original session if password update fails
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
