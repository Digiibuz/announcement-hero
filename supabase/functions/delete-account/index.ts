import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Obtenir l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🗑️ Suppression du compte demandée pour l'utilisateur: ${user.id}`);

    // 1. Supprimer toutes les annonces de l'utilisateur
    console.log('Suppression des annonces...');
    const { error: announcementsError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('user_id', user.id);

    if (announcementsError) {
      console.error('Error deleting announcements:', announcementsError);
      throw new Error(`Erreur lors de la suppression des annonces: ${announcementsError.message}`);
    }

    // 2. Supprimer les connexions Facebook
    console.log('Suppression des connexions Facebook...');
    const { error: facebookError } = await supabaseAdmin
      .from('facebook_connections')
      .delete()
      .eq('user_id', user.id);

    if (facebookError) {
      console.error('Error deleting Facebook connections:', facebookError);
    }

    // 3. Supprimer les connexions Google Business
    console.log('Suppression des connexions Google Business...');
    const { error: googleError } = await supabaseAdmin
      .from('user_google_business_profiles')
      .delete()
      .eq('user_id', user.id);

    if (googleError) {
      console.error('Error deleting Google connections:', googleError);
    }

    // 4. Supprimer les limites mensuelles IA
    console.log('Suppression des limites IA...');
    const { error: aiLimitsError } = await supabaseAdmin
      .from('monthly_ai_limits')
      .delete()
      .eq('user_id', user.id);

    if (aiLimitsError) {
      console.error('Error deleting AI limits:', aiLimitsError);
    }

    // 5. Supprimer les limites de publication
    console.log('Suppression des limites de publication...');
    const { error: pubLimitsError } = await supabaseAdmin
      .from('monthly_publication_limits')
      .delete()
      .eq('user_id', user.id);

    if (pubLimitsError) {
      console.error('Error deleting publication limits:', pubLimitsError);
    }

    // 6. Supprimer les rôles utilisateur
    console.log('Suppression des rôles utilisateur...');
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    }

    // 7. Supprimer le profil utilisateur
    console.log('Suppression du profil...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error(`Erreur lors de la suppression du profil: ${profileError.message}`);
    }

    // 8. Supprimer les fichiers de l'utilisateur dans le storage
    console.log('Suppression des fichiers...');
    try {
      const { data: files } = await supabaseAdmin
        .storage
        .from('announcement-images')
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${user.id}/${file.name}`);
        await supabaseAdmin
          .storage
          .from('announcement-images')
          .remove(filePaths);
      }
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError);
    }

    // 9. Supprimer l'utilisateur auth
    console.log('Suppression de l\'utilisateur auth...');
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${deleteUserError.message}`);
    }

    console.log(`✅ Compte ${user.id} supprimé avec succès`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Compte supprimé avec succès'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
