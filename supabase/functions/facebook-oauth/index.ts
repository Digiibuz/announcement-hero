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
    const { code, userId, state, redirectUri } = await req.json();

    if (!code || !userId || !redirectUri) {
      throw new Error('Missing code, userId or redirectUri');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');

    console.log('🔑 Redirect URI utilisé:', redirectUri);

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error('Facebook credentials not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🔐 VALIDATION DU STATE (Protection CSRF - Recommandation Meta)
    if (state) {
      const { data: stateData, error: stateError } = await supabaseClient
        .from('facebook_auth_states')
        .select('*')
        .eq('user_id', userId)
        .eq('state', state)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (stateError || !stateData) {
        console.error('❌ Invalid or expired state parameter');
        throw new Error('Invalid or expired authentication request. Please try again.');
      }

      // Supprimer le state utilisé
      await supabaseClient
        .from('facebook_auth_states')
        .delete()
        .eq('id', stateData.id);

      console.log('✅ State validated successfully');
    }

    // Exchange code for access token (recommandation Meta)
    // ⚠️ CRITIQUE: Le redirect_uri DOIT être exactement le même que celui utilisé pour obtenir le code
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('🔑 Échange du code pour un token...');
    const tokenResponse = await fetch(tokenUrl);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokenData: FacebookTokenResponse = await tokenResponse.json();

    console.log('📊 Token response:', { hasToken: !!tokenData.access_token, expiresIn: tokenData.expires_in });

    if (!tokenData.access_token) {
      console.error('❌ Pas de token reçu:', tokenData);
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    // 🔐 INSPECTION DU TOKEN (Recommandation Meta pour sécurité)
    const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
    const debugTokenUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${tokenData.access_token}&access_token=${appAccessToken}`;
    
    console.log('🔍 Inspection du token...');
    const debugResponse = await fetch(debugTokenUrl);
    const debugData = await debugResponse.json();
    
    if (debugData.data?.is_valid !== true) {
      console.error('❌ Token invalide:', debugData);
      throw new Error('Invalid access token received from Facebook');
    }
    
    console.log('✅ Token validé:', {
      app_id: debugData.data.app_id,
      user_id: debugData.data.user_id,
      expires_at: debugData.data.expires_at,
      scopes: debugData.data.scopes
    });

    // Exchange short-lived token for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
    console.log('🔄 Exchange pour un token longue durée...');
    
    const longTokenResponse = await fetch(longTokenUrl);
    const longTokenData: FacebookTokenResponse = await longTokenResponse.json();
    
    const finalAccessToken = longTokenData.access_token || tokenData.access_token;
    const finalExpiresIn = longTokenData.expires_in || tokenData.expires_in;
    
    console.log('✅ Token final:', { hasToken: !!finalAccessToken, expiresIn: finalExpiresIn });

    // Vérifier d'abord les informations de base de l'utilisateur
    const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${finalAccessToken}`;
    console.log('👤 Récupération des infos utilisateur...');
    const meResponse = await fetch(meUrl);
    const meData = await meResponse.json();
    console.log('👤 User data:', meData);

    // Get user's pages with detailed fields
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks,instagram_business_account{id,username}&access_token=${finalAccessToken}`;
    console.log('📄 Récupération des pages Facebook...');
    console.log('🔗 URL appelée:', pagesUrl.replace(finalAccessToken, 'TOKEN_HIDDEN'));
    
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
      pages: pagesData.data?.map((p: any) => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account, tasks: p.tasks }))
    });

    if (pagesData.error) {
      const errorDetails = `${pagesData.error.message} (code: ${pagesData.error.code}, type: ${pagesData.error.type || 'unknown'})`;
      console.error('❌ Erreur Facebook API:', errorDetails);
      
      if (pagesData.error.code === 190) {
        throw new Error(`Token invalide ou expiré. Veuillez réessayer la connexion. Détails: ${errorDetails}`);
      }
      
      if (pagesData.error.code === 200 || pagesData.error.code === 10 || pagesData.error.message.includes('permissions')) {
        throw new Error(`❌ Permissions manquantes. Lors de la connexion Facebook, vous devez:\n1. Accepter TOUTES les permissions demandées\n2. Sélectionner les pages que vous souhaitez connecter\n3. Cliquer sur "Continuer" ou "OK"\n\nDétails: ${errorDetails}`);
      }
      
      throw new Error(`Erreur Facebook API: ${errorDetails}`);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('❌ Aucune page personnelle trouvée. Recherche dans Business Manager...');
      
      // Pour les pages Business Manager : récupérer les businesses puis leurs pages
      const businessUrl = `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${finalAccessToken}`;
      const businessResponse = await fetch(businessUrl);
      const businessData = await businessResponse.json();
      
      console.log('📊 Businesses trouvés:', businessData);
      
      if (businessData.error) {
        throw new Error(`Erreur lors de la récupération des businesses: ${businessData.error.message}`);
      }
      
      if (!businessData.data || businessData.data.length === 0) {
        throw new Error(`❌ Aucune page trouvée.\n\n**Diagnostic:**\n- Pages personnelles: 0\n- Business Manager: 0\n\nVérifiez que:\n1. Vous avez bien des pages Facebook associées à votre compte\n2. Vous avez accepté toutes les permissions lors de la connexion\n3. Votre app Facebook est en mode Live (ou utilisez un test user)`);
      }
      
      // Récupérer les pages de chaque business
      const allBusinessPages: FacebookPageData[] = [];
      
      for (const business of businessData.data) {
        console.log(`🏢 Récupération des pages du business: ${business.name} (${business.id})`);
        
        // Essayer d'abord owned_pages puis client_pages
        const ownedPagesUrl = `https://graph.facebook.com/v21.0/${business.id}/owned_pages?fields=id,name,access_token,tasks,instagram_business_account{id,username}&access_token=${finalAccessToken}`;
        const ownedPagesResponse = await fetch(ownedPagesUrl);
        const ownedPagesData = await ownedPagesResponse.json();
        
        console.log(`  → Owned pages:`, ownedPagesData);
        
        if (ownedPagesData.data && ownedPagesData.data.length > 0) {
          allBusinessPages.push(...ownedPagesData.data);
        }
        
        // Essayer aussi client_pages
        const clientPagesUrl = `https://graph.facebook.com/v21.0/${business.id}/client_pages?fields=id,name,access_token,tasks,instagram_business_account{id,username}&access_token=${finalAccessToken}`;
        const clientPagesResponse = await fetch(clientPagesUrl);
        const clientPagesData = await clientPagesResponse.json();
        
        console.log(`  → Client pages:`, clientPagesData);
        
        if (clientPagesData.data && clientPagesData.data.length > 0) {
          allBusinessPages.push(...clientPagesData.data);
        }
      }
      
      if (allBusinessPages.length === 0) {
        throw new Error(`❌ Aucune page trouvée dans Business Manager.\n\nBusinesses détectés: ${businessData.data.length}\nPages trouvées: 0\n\nAssurez-vous que les pages sont bien liées au Business Manager.`);
      }
      
      console.log(`✅ ${allBusinessPages.length} page(s) trouvée(s) dans Business Manager`);
      pagesData.data = allBusinessPages;
    }

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

    console.log(`✅ ${connections.length} page(s) connectée(s) avec succès`);

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
