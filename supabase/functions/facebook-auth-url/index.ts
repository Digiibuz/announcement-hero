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
    const { redirectUri } = await req.json();

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');

    if (!FACEBOOK_APP_ID) {
      throw new Error('FACEBOOK_APP_ID not configured in Supabase secrets');
    }

    // Permissions Facebook requises pour gérer les pages et Instagram
    const scope = [
      'pages_manage_metadata',      // Requis pour accéder à me/accounts
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',');
    
    const state = Math.random().toString(36).substring(7); // Token de sécurité
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;

    console.log('Generated Facebook auth URL with scopes:', scope);

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
