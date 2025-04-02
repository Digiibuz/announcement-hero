
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clone the request before reading it to avoid "Body already consumed" error
    const reqClone = req.clone();
    const { generationId } = await reqClone.json();

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    // Get generation data with all related information
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select(`
        *,
        category:categories_keywords!tome_generations_category_id_fkey(category_name),
        keyword:categories_keywords(keyword),
        locality:localities(name, region)
      `)
      .eq('id', generationId)
      .single();

    if (generationError || !generation) {
      throw new Error('Generation not found: ' + (generationError?.message || 'Unknown error'));
    }

    if (generation.status !== 'draft') {
      throw new Error('Only draft publications can be published');
    }

    if (!generation.content) {
      throw new Error('No content to publish');
    }

    // Update status to processing
    await supabase
      .from('tome_generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    // Get WordPress config
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', generation.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      throw new Error('WordPress config not found');
    }

    // Now we need to publish to WordPress
    // Get the WordPress API URL
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;
    
    let apiEndpoint = '/wp-json/wp/v2/pages';
    
    // Prepare browser-like headers to avoid WAF detection
    const browserLikeHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': siteUrl,
      'Origin': siteUrl,
      'DNT': '1',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };
    
    // Use Basic Auth with application password
    if (wpConfig.app_username && wpConfig.app_password) {
      const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
      browserLikeHeaders['Authorization'] = `Basic ${credentials}`;
    } else {
      throw new Error('WordPress API credentials not configured');
    }
    
    // Prepare the post data
    const postData = {
      title: generation.title || "Nouveau contenu",
      content: generation.content,
      status: 'publish',
      
      // If we have category ID, add it here
      // We'll use the categories from WordPress, if available
      categoryId: generation.category_id,
    };
    
    try {
      // Ajout d'un délai avant de faire la requête WordPress pour éviter la détection du Bot
      console.log("Attente de 3 secondes avant de contacter WordPress...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log("Test de l'API DipiPixel...");
      // Let's first check if we're dealing with a DipiPixel site with custom taxonomy
      const testResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
        method: 'HEAD',
        headers: browserLikeHeaders
      });
      
      if (testResponse.status !== 404) {
        // DipiPixel custom post type exists
        console.log("DipiPixel détecté, utilisation de l'API dipi_cpt");
        apiEndpoint = '/wp-json/wp/v2/dipi_cpt';
        // Add category using custom taxonomy
        postData["dipi_cpt_category"] = [parseInt(generation.category_id)];
      }
    } catch (error) {
      console.log("Error checking for DipiPixel:", error);
      // Continue with standard WordPress endpoint
    }
    
    try {
      console.log(`Publication sur WordPress: ${siteUrl}${apiEndpoint}`);
      
      // Add a timeout to the WordPress request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Publish to WordPress
      const wpResponse = await fetch(`${siteUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: browserLikeHeaders,
        body: JSON.stringify(postData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`);
      }
      
      const wpData = await wpResponse.json();
      
      // Update generation status in Supabase
      await supabase
        .from('tome_generations')
        .update({ 
          status: 'published',
          wordpress_post_id: wpData.id,
          published_at: new Date().toISOString()
        })
        .eq('id', generationId);
      
      // Return successful response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Content published successfully',
          generationId,
          wordpressPostId: wpData.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (wpError) {
      console.error("WordPress API error:", wpError);
      
      // Si l'erreur contient du HTML (comme avec Tiger Protect), on considère que c'est un problème de WAF
      const errorMessage = wpError.message || "";
      if (errorMessage.includes("<!DOCTYPE HTML>") || errorMessage.includes("<html")) {
        throw new Error("Le pare-feu WordPress (WAF) a bloqué notre requête. Veuillez essayer depuis l'interface d'administration WordPress.");
      }
      
      throw wpError;
    }
    
  } catch (error) {
    console.error('Error in tome-publish function:', error);
    
    let errorMessage = error.message || 'An error occurred during publishing';
    let friendlyMessage = errorMessage;
    
    // Améliorer les messages d'erreur pour l'utilisateur
    if (errorMessage.includes("WAF") || errorMessage.includes("pare-feu")) {
      friendlyMessage = "Le pare-feu WordPress (WAF) bloque notre requête. Vous devrez peut-être publier manuellement depuis WordPress.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("abort")) {
      friendlyMessage = "Délai d'attente dépassé lors de la connexion à WordPress. Veuillez vérifier l'URL et les identifiants.";
    } else if (errorMessage.includes("503")) {
      friendlyMessage = "Le serveur WordPress est temporairement indisponible (erreur 503). Veuillez réessayer plus tard.";
    }
    
    // Try to update generation status to failed
    try {
      // Clone the request again to read generationId for status update
      const reqClone2 = req.clone();
      const { generationId } = await reqClone2.json();
      
      if (generationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('tome_generations')
            .update({ 
              status: 'draft', // Remettre en brouillon en cas d'échec
              error_message: friendlyMessage.substring(0, 255) // Limiter la taille
            })
            .eq('id', generationId);
        }
      }
    } catch (updateError) {
      console.error('Error updating generation status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: friendlyMessage,
        technicalError: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
