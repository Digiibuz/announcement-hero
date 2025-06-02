
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
    
    const { email, password, name, role, wordpressConfigId, commercialId } = requestData;
    
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

    // Validate role
    const validRoles = ['admin', 'editor', 'client', 'commercial'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ 
          error: "Rôle invalide",
          details: `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Sanitize wordpressConfigId and commercialId - if empty string or not provided, set to null
    const sanitizedWordpressConfigId = wordpressConfigId && wordpressConfigId.trim() !== "" 
      ? wordpressConfigId 
      : null;
    
    const sanitizedCommercialId = commercialId && commercialId.trim() !== "" 
      ? commercialId 
      : null;
    
    console.log(`Processing user creation: Email: ${email}, Name: ${name}, Role: ${role}, WordPress Config ID: ${sanitizedWordpressConfigId}, Commercial ID: ${sanitizedCommercialId}`);

    // Step 1: Check if email already exists in auth.users
    try {
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (searchError) {
        console.error("Error checking auth.users:", searchError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification des utilisateurs existants", details: searchError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      if (existingUsers && existingUsers.users) {
        const emailExists = existingUsers.users.some(user => user.email === email);
        
        if (emailExists) {
          console.log("Email already exists in auth.users:", email);
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

    // Step 2: Check if email already exists in profiles table
    try {
      const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email);
      
      if (profilesError) {
        console.error("Error checking profiles table:", profilesError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification des profils existants", details: profilesError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("Email already exists in profiles table:", email);
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

    // Step 3: Create user with transaction to ensure everything is consistent
    let userId;
    try {
      // Begin creating user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role,
          wordpressConfigId: sanitizedWordpressConfigId,
          commercialId: sanitizedCommercialId,
        }
      });

      if (createError) {
        console.error("Error creating user in auth.users:", createError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création de l'utilisateur", details: createError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!userData || !userData.user) {
        throw new Error("Échec de la création de l'utilisateur - aucune donnée retournée");
      }
      
      userId = userData.user.id;
      console.log("User created successfully:", userId);

      // Check if profile already exists (should never happen at this point, but just in case)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Update existing profile
        console.log("Profile already exists for user, updating:", userId);
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            email: email,
            name: name,
            role: role,
            wordpress_config_id: sanitizedWordpressConfigId,
            commercial_id: sanitizedCommercialId
          })
          .eq('id', userId);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          // Rollback by deleting the auth user
          await supabaseAdmin.auth.admin.deleteUser(userId);
          
          return new Response(
            JSON.stringify({ error: "Erreur lors de la mise à jour du profil", details: updateError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      } else {
        // Create new profile
        console.log("Creating profile for user:", userId);
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: name,
            role: role,
            wordpress_config_id: sanitizedWordpressConfigId,
            commercial_id: sanitizedCommercialId
          });

        if (profileError) {
          // If profile creation fails, delete the auth user
          console.error("Error creating profile, rolling back user creation:", profileError);
          await supabaseAdmin.auth.admin.deleteUser(userId);
          
          return new Response(
            JSON.stringify({ error: "Erreur lors de la création du profil", details: profileError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }
      
      console.log("Profile created/updated successfully for user:", userId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: userData.user,
          message: "Utilisateur créé avec succès" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
      
    } catch (error) {
      console.error("Error in user creation process:", error);
      
      // Attempt to rollback if we have a userId
      if (userId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          console.log("Rolled back user creation:", userId);
        } catch (rollbackError) {
          console.error("Error rolling back user creation:", rollbackError);
        }
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'utilisateur", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Unhandled error:", error);
    
    return new Response(
      JSON.stringify({ error: "Une erreur inattendue est survenue", details: error.message || "Détails inconnus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
