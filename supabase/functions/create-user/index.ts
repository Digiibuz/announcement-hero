
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Les variables d'environnement Supabase ne sont pas configurées" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data received:", JSON.stringify(requestData));
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Erreur dans la récupération des données JSON", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { email, password, name, role, wordpressConfigId } = requestData;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ 
          error: "Données requises manquantes",
          details: "Email, mot de passe, nom et rôle sont tous requis" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Sanitize wordpressConfigId - if empty string or not provided, set to null
    const sanitizedWordpressConfigId = wordpressConfigId && wordpressConfigId.trim() !== "" 
      ? wordpressConfigId 
      : null;
    
    console.log(`Processing user creation: Email: ${email}, Name: ${name}, Role: ${role}, WordPress Config ID: ${sanitizedWordpressConfigId}`);

    // Check if email already exists in auth.users
    try {
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (searchError) {
        throw searchError;
      }
      
      if (existingUsers && existingUsers.users) {
        const emailExists = existingUsers.users.some(user => user.email === email);
        
        if (emailExists) {
          return new Response(
            JSON.stringify({ 
              error: "L'utilisateur existe déjà", 
              details: "Cet email est déjà utilisé par un compte existant." 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      }
    } catch (error) {
      console.error("Error checking auth.users:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification des utilisateurs existants", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check if email already exists in profiles table
    try {
      const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email);
      
      if (profilesError) {
        throw profilesError;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: "L'utilisateur existe déjà", 
            details: "L'email est déjà utilisé dans la table des profils." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } catch (error) {
      console.error("Error checking profiles table:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification des profils existants", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create user in auth.users
    let userData;
    try {
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role,
          wordpressConfigId: sanitizedWordpressConfigId,
        }
      });

      if (createError) {
        throw createError;
      }

      if (!data || !data.user) {
        throw new Error("Échec de la création de l'utilisateur - aucune donnée retournée");
      }
      
      userData = data;
      console.log("User created successfully:", userData.user.id);
      
    } catch (error) {
      console.error("Error creating user in auth.users:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'utilisateur", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create profile manually in the profiles table
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userData.user.id,
          email: email,
          name: name,
          role: role,
          wordpress_config_id: sanitizedWordpressConfigId
        });

      if (profileError) {
        // If profile creation fails, delete the auth user to maintain consistency
        console.error("Error creating profile, rolling back user creation:", profileError);
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        
        throw profileError;
      }
      
      console.log("Profile created successfully for user:", userData.user.id);
      
    } catch (error) {
      console.error("Error creating user profile:", error);
      return new Response(
        JSON.stringify({ error: `Échec de la création du profil: ${error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: "Utilisateur créé avec succès" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Erreur non gérée:", error);
    
    return new Response(
      JSON.stringify({ error: "Une erreur inattendue est survenue", details: error.message || "Détails inconnus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
