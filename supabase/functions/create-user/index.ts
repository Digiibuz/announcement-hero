
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

    // Créer le client Supabase avec le rôle de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données de la requête
    const { email, password, name, role, wordpressConfigId } = await req.json();
    
    // Vérifier les données requises
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: "Données requises manquantes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Valider wordpressConfigId - si chaîne vide ou non fourni, définir à null
    const sanitizedWordpressConfigId = wordpressConfigId && wordpressConfigId.trim() !== "" 
      ? wordpressConfigId 
      : null;
    
    console.log(`Email: ${email}, Role: ${role}, WordPress Config ID: ${sanitizedWordpressConfigId}`);

    // Vérifier si l'email existe déjà dans la table auth.users
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      return new Response(
        JSON.stringify({ error: searchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const emailExists = existingUsers && existingUsers.users.some(user => user.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          error: "L'utilisateur existe déjà", 
          details: "Cet email est déjà utilisé par un compte existant." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Vérifier si l'email existe déjà dans la table profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (profilesError) {
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
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

    // Créer l'utilisateur dans auth.users
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        name,
        role,
        wordpressConfigId: sanitizedWordpressConfigId,
      }
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!userData || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Échec de la création de l'utilisateur - aucune donnée retournée" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Créer le profil manuellement dans la table profiles
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
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      
      return new Response(
        JSON.stringify({ error: `Échec de la création du profil: ${profileError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user: userData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Erreur non gérée:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
