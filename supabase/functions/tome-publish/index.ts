
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
    let requestData;
    try {
      requestData = await reqClone.json();
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
    
    const { generationId, debug = true } = requestData;

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    // Get generation data directly without complex joins
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select('*')
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

    // Get category name separately if needed
    let categoryName = null;
    if (generation.category_id) {
      const { data: categoryData } = await supabase
        .from('categories_keywords')
        .select('category_name')
        .eq('id', generation.category_id)
        .single();
      
      if (categoryData) {
        categoryName = categoryData.category_name;
      }
    }

    // Get keyword separately if needed
    let keywordText = null;
    if (generation.keyword_id) {
      const { data: keywordData } = await supabase
        .from('categories_keywords')
        .select('keyword')
        .eq('id', generation.keyword_id)
        .single();
      
      if (keywordData) {
        keywordText = keywordData.keyword;
      }
    }

    // Get locality data separately if needed
    let localityName = null;
    let localityRegion = null;
    if (generation.locality_id) {
      const { data: localityData } = await supabase
        .from('localities')
        .select('name, region')
        .eq('id', generation.locality_id)
        .single();
      
      if (localityData) {
        localityName = localityData.name;
        localityRegion = localityData.region;
      }
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

    // Now we need to publish to WordPress using similar approach as announcements
    // Normalize the site URL
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;

    // First, determine the correct endpoint (same approach as in announcements)
    let useCustomTaxonomy = false;
    let postEndpoint = `${siteUrl}/wp-json/wp/v2/pages`; // Default endpoint
    
    try {
      // First try to access the dipi_cpt_category endpoint with a timeout (like in announcements)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Using standard fetch headers for this initial test
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }).catch(() => ({ status: 404 }));
      
      clearTimeout(timeoutId);
      
      if (response && response.status !== 404) {
        useCustomTaxonomy = true;
        
        // Now check if dipi_cpt endpoint exists (with timeout)
        const dipiController = new AbortController();
        const dipiTimeoutId = setTimeout(() => dipiController.abort(), 5000);
        
        const dipiResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: dipiController.signal
        }).catch(() => ({ status: 404 }));
        
        clearTimeout(dipiTimeoutId);
        
        if (dipiResponse && dipiResponse.status !== 404) {
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
        } else {
          // Try alternative endpoint (with timeout)
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), 5000);
          
          const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
            method: 'HEAD',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: altController.signal
          }).catch(() => ({ status: 404 }));
          
          clearTimeout(altTimeoutId);
          
          if (altResponse && altResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
          }
        }
      }
    } catch (error) {
      console.log("Error checking endpoints:", error);
      console.log("Falling back to standard pages endpoint");
    }
    
    if (debug) {
      console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
    }
    
    // Prepare headers with authentication - using simpler approach from announcements
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': siteUrl,
      'Origin': siteUrl,
    };
    
    // Check for authentication credentials
    if (wpConfig.app_username && wpConfig.app_password) {
      // Application Password Format: "Basic base64(username:password)"
      const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else {
      throw new Error('WordPress API credentials not configured');
    }
    
    // Prepare the post data
    const postData: any = {
      title: generation.title || "Nouveau contenu",
      content: generation.content,
      status: 'publish',
    };
    
    // Add category if available, using the custom taxonomy approach from announcements
    if (generation.category_id && useCustomTaxonomy) {
      postData.dipi_cpt_category = [parseInt(generation.category_id)];
    } else if (generation.category_id) {
      postData.categories = [parseInt(generation.category_id)];
    }
    
    try {
      if (debug) {
        console.log("Sending POST request to WordPress:", postEndpoint);
      }
      
      // Ajout d'un délai avant de faire la requête pour éviter la détection par les WAF
      console.log("Attente de 2 secondes avant de contacter WordPress...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
      
      // Send the request - simpler approach like in announcements
      const postResponse = await fetch(postEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(postData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!postResponse.ok) {
        let errorText = await postResponse.text();
        console.error("WordPress API error:", errorText);
        
        // Check for HTML response (WAF block)
        if (errorText.includes("<!DOCTYPE") || 
            errorText.includes("<html") || 
            errorText.includes("Tiger Protect") ||
            errorText.includes("WAF") ||
            errorText.includes("security-challenge")) {
          throw new Error("Le pare-feu WordPress a bloqué la requête. Veuillez publier manuellement depuis WordPress.");
        }
        
        throw new Error(`WordPress API error (${postResponse.status}): ${errorText}`);
      }
      
      // Parse JSON response
      let wpResponseData;
      try {
        wpResponseData = await postResponse.json();
        if (debug) {
          console.log("WordPress response data:", wpResponseData);
        }
      } catch (error) {
        console.error("Error parsing WordPress response:", error);
        throw new Error("Error parsing WordPress response");
      }
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && typeof wpResponseData.id === 'number') {
        const wordpressPostId = wpResponseData.id;
        console.log("WordPress post ID received:", wordpressPostId);
        
        // Update generation status in Supabase
        await supabase
          .from('tome_generations')
          .update({ 
            status: 'published',
            wordpress_post_id: wordpressPostId,
            published_at: new Date().toISOString(),
            is_divipixel: useCustomTaxonomy
          })
          .eq('id', generationId);
        
        // Return successful response
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Content published successfully',
            generationId,
            wordpressPostId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        throw new Error("WordPress response does not contain a valid post ID");
      }
    } catch (error: any) {
      console.error("WordPress API error:", error);
      
      // Better error classification and handling
      let errorMessage = error.message || "An error occurred during publishing";
      let statusCode = 'failed';
      
      if (errorMessage.includes("pare-feu") || 
          errorMessage.includes("firewall") || 
          errorMessage.includes("WAF") || 
          errorMessage.includes("<html") || 
          errorMessage.includes("<!DOCTYPE") ||
          errorMessage.includes("Tiger Protect") ||
          errorMessage.includes("security-challenge")) {
        errorMessage = "Le pare-feu WordPress a bloqué la requête. Veuillez publier manuellement depuis WordPress.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("abort")) {
        errorMessage = "Délai d'attente dépassé lors de la connexion à WordPress. Veuillez vérifier l'URL et les identifiants.";
      } else if (errorMessage.includes("redirects")) {
        errorMessage = "Trop de redirections détectées. Cela indique souvent un plugin de sécurité WordPress. Essayez de publier manuellement depuis WordPress.";
      }
      
      // Reset status to draft on failure so user can try again
      await supabase
        .from('tome_generations')
        .update({ 
          status: 'draft',
          error_message: errorMessage.substring(0, 255) // Limit the length
        })
        .eq('id', generationId);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Error in tome-publish function:', error);
    
    let errorMessage = error.message || 'An error occurred during publishing';
    
    // Try to update generation status to draft on error
    try {
      // Clone the request again to read generationId for status update
      const reqClone2 = req.clone();
      const requestData = await reqClone2.json();
      const generationId = requestData.generationId;
      
      if (generationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('tome_generations')
            .update({ 
              status: 'draft', // Reset to draft on failure
              error_message: errorMessage.substring(0, 255) // Limit the length
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
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
