import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPageData {
  id: string;
  name: string;
  access_token: string;
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      throw new Error('Missing code or userId');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const REDIRECT_URI = `${req.headers.get('origin')}/facebook-callback`;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error('Facebook credentials not configured');
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData: FacebookTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token from Facebook');
    }

    // Get user's pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store each page connection
    const connections = [];
    for (const page of pagesData.data as FacebookPageData[]) {
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { data, error } = await supabaseClient
        .from('facebook_connections')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
          expires_at: expiresAt,
        }, {
          onConflict: 'user_id,page_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing Facebook connection:', error);
        continue;
      }

      connections.push(data);
    }

    return new Response(
      JSON.stringify({ success: true, connections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
