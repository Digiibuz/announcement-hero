
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

    // Log authentication attempt (without password)
    console.log(`Tentative de connexion pour: ${email}`);

    // Step 1: First verify credentials with original password
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    // If authentication fails, return error immediately
    if (signInError) {
      console.error(`Échec de l'authentification:`, signInError.message);
      return new Response(
        JSON.stringify({ error: signInError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Ensure we have valid user data
    if (!signInData?.user || !signInData?.session) {
      console.error("Authentification réussie mais données de session invalides");
      return new Response(
        JSON.stringify({ error: "Données d'authentification invalides" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Successfully authenticated, now generate a random suffix
    console.log(`Authentification réussie pour: ${email}, mise à jour du mot de passe`);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newPassword = `${password}${randomSuffix}`;

    // Step 2: Update the password with the new randomly-suffixed password
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        signInData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error(`Échec de la mise à jour du mot de passe:`, updateError.message);
        
        // If password update fails, login is still valid
        // Return the session from the initial successful login
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

      // Step 3: Password successfully updated, return session info
      console.log(`Mot de passe mis à jour avec succès pour: ${email}`);
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
    } catch (updateError: any) {
      console.error(`Erreur inattendue lors de la mise à jour du mot de passe:`, updateError.message);
      
      // Return the original session if password update encountered an exception
      return new Response(
        JSON.stringify({ 
          user: signInData.user, 
          session: signInData.session,
          passwordUpdated: false,
          updateError: updateError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Still returning 200 since login was successful
        }
      );
    }
  } catch (error: any) {
    console.error(`Erreur générale dans la fonction secure-login:`, error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de la connexion",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
