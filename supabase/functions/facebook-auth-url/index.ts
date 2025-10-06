import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { redirectUri, userId } = await req.json();

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');

    if (!FACEBOOK_APP_ID) {
      throw new Error('FACEBOOK_APP_ID not configured in Supabase secrets');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    // Permissions Facebook requises - selon la doc Meta 2024
    const scope = [
      'public_profile',              // Requis - profil de base
      'email',                       // Email de l'utilisateur
      'pages_show_list',             // Voir la liste des pages
      'pages_read_engagement',       // Lire les données des pages
      'pages_manage_metadata',       // Gérer les métadonnées des pages
      'pages_manage_posts',          // Publier sur les pages
      'instagram_basic',             // Accès Instagram de base
      'instagram_content_publish',   // Publier sur Instagram
      'pages_read_user_content',     // Lire le contenu utilisateur des pages
    ].join(',');
    
    // Générer un state unique pour CSRF protection (recommandation Meta)
    const state = crypto.randomUUID();
    
    // Stocker le state en DB pour validation ultérieure
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Stocker le state temporairement (expire après 10 minutes)
    await supabaseClient
      .from('facebook_auth_states')
      .insert({
        user_id: userId,
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    // URL d'authentification selon la doc Meta
    // response_type=code pour le flux serveur-to-serveur (plus sécurisé)
    // auth_type=rerequest pour forcer la sélection des pages
    // display=popup pour une meilleure UX
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code&auth_type=rerequest&display=popup`;

    console.log('✅ Generated Facebook auth URL with scopes:', scope);
    console.log('🔐 State generated:', state);

    return new Response(
      JSON.stringify({ authUrl, state }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error generating Facebook auth URL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
