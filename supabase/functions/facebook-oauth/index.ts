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
    
    console.log('🔑 Échange du code pour un token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData: FacebookTokenResponse = await tokenResponse.json();

    console.log('📊 Token response:', { hasToken: !!tokenData.access_token, expiresIn: tokenData.expires_in });

    if (!tokenData.access_token) {
      console.error('❌ Pas de token reçu:', tokenData);
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    // Exchange short-lived token for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
    console.log('🔄 Exchange pour un token longue durée...');
    
    const longTokenResponse = await fetch(longTokenUrl);
    const longTokenData: FacebookTokenResponse = await longTokenResponse.json();
    
    const finalAccessToken = longTokenData.access_token || tokenData.access_token;
    const finalExpiresIn = longTokenData.expires_in || tokenData.expires_in;
    
    console.log('✅ Token final:', { hasToken: !!finalAccessToken, expiresIn: finalExpiresIn });

    // Get user's pages with detailed fields
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${finalAccessToken}`;
    console.log('📄 Récupération des pages Facebook...');
    console.log('🔗 URL:', pagesUrl.replace(finalAccessToken, 'TOKEN_HIDDEN'));
    
    const pagesResponse = await fetch(pagesUrl);
    const pagesResponseText = await pagesResponse.text();
    
    console.log('📡 Facebook API status:', pagesResponse.status);
    console.log('📡 Facebook API response:', pagesResponseText);
    
    let pagesData;
    try {
      pagesData = JSON.parse(pagesResponseText);
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      throw new Error(`Invalid JSON response from Facebook: ${pagesResponseText.substring(0, 200)}`);
    }

    console.log('📊 Pages response:', { 
      hasData: !!pagesData.data, 
      pagesCount: pagesData.data?.length || 0,
      error: pagesData.error,
      pages: pagesData.data?.map((p: any) => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account }))
    });

    if (pagesData.error) {
      const errorDetails = `${pagesData.error.message} (code: ${pagesData.error.code}, type: ${pagesData.error.type || 'unknown'})`;
      console.error('❌ Erreur Facebook API:', errorDetails);
      
      if (pagesData.error.code === 190) {
        throw new Error(`Token invalide ou expiré. Veuillez réessayer la connexion. Détails: ${errorDetails}`);
      }
      
      if (pagesData.error.code === 200 || pagesData.error.message.includes('permissions')) {
        throw new Error(`Permissions manquantes. Assurez-vous d'accorder toutes les permissions demandées lors de la connexion Facebook. Détails: ${errorDetails}`);
      }
      
      throw new Error(`Erreur Facebook API: ${errorDetails}`);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('❌ Aucune page trouvée. Full response:', pagesResponseText);
      throw new Error('Aucune page Facebook trouvée. Vérifiez que: 1) Vous êtes administrateur d\'au moins une page Facebook, 2) Vous avez accordé les permissions "pages_manage_metadata", "pages_read_engagement", "pages_manage_posts" lors de l\'autorisation, 3) Vous avez bien sélectionné votre page dans la popup de sélection Facebook.');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store each page connection
    console.log(`💾 Sauvegarde de ${pagesData.data.length} page(s)...`);
    const connections = [];
    for (const page of pagesData.data as FacebookPageData[]) {
      const expiresAt = finalExpiresIn
        ? new Date(Date.now() + finalExpiresIn * 1000).toISOString()
        : null;

      console.log(`  → Page: ${page.name} (ID: ${page.id})`);

      const { data, error } = await supabaseClient
        .from('facebook_connections')
        .upsert({
          user_id: userId,
          access_token: finalAccessToken,
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
