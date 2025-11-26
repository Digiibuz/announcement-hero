import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressConfig {
  site_url: string;
  app_username: string | null;
  app_password: string | null;
  rest_api_key: string | null;
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, configId, ...params } = await req.json();
    console.log(`📡 WordPress Proxy - Action: ${action}, User: ${user.id}, Config: ${configId}`);

    // Récupérer la configuration WordPress
    const { data: config, error: configError } = await supabaseClient
      .from('wordpress_configs')
      .select('site_url, app_username, app_password, rest_api_key')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      console.error('❌ Configuration not found:', configError);
      return new Response(
        JSON.stringify({ error: 'WordPress configuration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const wpConfig = config as WordPressConfig;

    // Router vers la bonne fonction selon l'action
    switch (action) {
      case 'getCategories':
        return await getCategories(supabaseClient, configId, wpConfig);
      
      case 'publishPost':
        return await publishPost(supabaseClient, wpConfig, params);
      
      case 'testConnection':
        return await testConnection(wpConfig);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('❌ WordPress Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Récupérer les catégories WordPress avec cache
async function getCategories(supabaseClient: any, configId: string, wpConfig: WordPressConfig) {
  console.log('📂 Fetching categories for config:', configId);

  // Vérifier le cache (moins de 1 heure)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: cachedCategories, error: cacheError } = await supabaseClient
    .from('wordpress_categories_cache')
    .select('*')
    .eq('wordpress_config_id', configId)
    .gt('updated_at', oneHourAgo);

  if (!cacheError && cachedCategories && cachedCategories.length > 0) {
    console.log('✅ Using cached categories:', cachedCategories.length);
    return new Response(
      JSON.stringify({
        success: true,
        categories: cachedCategories.map((c: any) => ({
          id: parseInt(c.category_id),
          name: c.category_name,
          slug: c.category_slug,
          count: c.category_count,
        })),
        cached: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Sinon, récupérer depuis WordPress
  console.log('🌐 Fetching fresh categories from WordPress');
  const categories = await fetchWordPressCategories(wpConfig);

  if (categories.length > 0) {
    // Mettre à jour le cache en arrière-plan
    EdgeRuntime.waitUntil(updateCategoriesCache(supabaseClient, configId, categories));
  }

  return new Response(
    JSON.stringify({
      success: true,
      categories,
      cached: false,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Récupérer les catégories depuis WordPress
async function fetchWordPressCategories(wpConfig: WordPressConfig): Promise<WordPressCategory[]> {
  const siteUrl = wpConfig.site_url.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Authentification
  if (wpConfig.app_username && wpConfig.app_password) {
    const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (wpConfig.rest_api_key) {
    headers['X-API-Key'] = wpConfig.rest_api_key;
  }

  // Essayer d'abord l'endpoint custom dipi_cpt_category
  try {
    console.log('🔍 Trying custom endpoint: dipi_cpt_category');
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category?per_page=100`, {
      headers,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetched categories from custom endpoint:', data.length);
      return data;
    }
  } catch (error) {
    console.warn('⚠️ Custom endpoint failed, trying standard categories:', error.message);
  }

  // Fallback sur l'endpoint standard
  try {
    console.log('🔍 Trying standard endpoint: categories');
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetched categories from standard endpoint:', data.length);
      return data;
    }
  } catch (error) {
    console.error('❌ Failed to fetch categories:', error);
  }

  return [];
}

// Mettre à jour le cache des catégories
async function updateCategoriesCache(supabaseClient: any, configId: string, categories: WordPressCategory[]) {
  console.log('💾 Updating categories cache for config:', configId);

  try {
    // Supprimer l'ancien cache
    await supabaseClient
      .from('wordpress_categories_cache')
      .delete()
      .eq('wordpress_config_id', configId);

    // Insérer les nouvelles catégories
    const cacheData = categories.map(cat => ({
      wordpress_config_id: configId,
      category_id: String(cat.id),
      category_name: cat.name,
      category_slug: cat.slug,
      category_count: cat.count,
      raw_data: cat,
    }));

    const { error } = await supabaseClient
      .from('wordpress_categories_cache')
      .insert(cacheData);

    if (error) {
      console.error('❌ Failed to update cache:', error);
    } else {
      console.log('✅ Cache updated successfully');
    }
  } catch (error) {
    console.error('❌ Error updating cache:', error);
  }
}

// Publier un post WordPress
async function publishPost(supabaseClient: any, wpConfig: WordPressConfig, params: any) {
  const { title, content, categoryId, status, featuredMediaId, seoTitle, seoDescription, seoSlug } = params;
  
  console.log('📝 Publishing post to WordPress:', title);

  const siteUrl = wpConfig.site_url.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Authentification
  if (wpConfig.app_username && wpConfig.app_password) {
    const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (wpConfig.rest_api_key) {
    headers['X-API-Key'] = wpConfig.rest_api_key;
  }

  const postData: any = {
    title,
    content,
    status: status || 'publish',
  };

  // Ajouter la catégorie si fournie
  if (categoryId) {
    // Détecter si c'est un custom post type ou standard
    const { data: config } = await supabaseClient
      .from('wordpress_configs')
      .select('endpoint_type')
      .eq('site_url', wpConfig.site_url)
      .single();

    if (config?.endpoint_type === 'dipi_cpt') {
      postData.dipi_cpt_category = [parseInt(categoryId)];
    } else {
      postData.categories = [parseInt(categoryId)];
    }
  }

  // Featured media
  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }

  // SEO (Yoast)
  if (seoTitle || seoDescription || seoSlug) {
    postData.yoast_meta = {
      yoast_wpseo_title: seoTitle,
      yoast_wpseo_metadesc: seoDescription,
    };
    if (seoSlug) {
      postData.slug = seoSlug;
    }
  }

  try {
    // Déterminer l'endpoint à utiliser
    const endpoint = config?.endpoint_type === 'dipi_cpt' ? 'pages' : 'posts';
    
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData),
      signal: AbortSignal.timeout(30000), // 30s timeout pour publication
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ WordPress API error:', errorData);
      throw new Error(`WordPress API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Post published successfully:', result.id);

    return new Response(
      JSON.stringify({
        success: true,
        post: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Failed to publish post:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Tester la connexion WordPress
async function testConnection(wpConfig: WordPressConfig) {
  console.log('🔌 Testing WordPress connection');

  const siteUrl = wpConfig.site_url.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Authentification
  if (wpConfig.app_username && wpConfig.app_password) {
    const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (wpConfig.rest_api_key) {
    headers['X-API-Key'] = wpConfig.rest_api_key;
  }

  try {
    // Test basique: accès à /wp-json
    const response = await fetch(`${siteUrl}/wp-json`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status}`);
    }

    console.log('✅ WordPress connection successful');

    return new Response(
      JSON.stringify({
        success: true,
        status: 'connected',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ WordPress connection failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        status: 'disconnected',
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
