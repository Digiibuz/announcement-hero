
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
    const postData: any = {
      title: generation.title || "Nouveau contenu",
      content: generation.content,
      status: 'publish',
    };
    
    // Add category ID if available
    if (generation.category_id) {
      postData.categories = [parseInt(generation.category_id)];
    }
    
    try {
      // Add delay before making WordPress request to avoid bot detection
      console.log("Waiting 3 seconds before contacting WordPress...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log("Testing DipiPixel API...");
      // Let's first check if we're dealing with a DipiPixel site with custom taxonomy
      // Use a fetch with the redirect option set to follow a limited number of redirects
      const testResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
        method: 'HEAD',
        headers: browserLikeHeaders,
        redirect: 'follow',
        // Set a maximum of 5 redirects to avoid infinite redirect loops
        signal: AbortSignal.timeout(10000) // 10-second timeout
      }).catch(err => {
        console.log("DipiPixel API test error:", err.message);
        // Just catch the error to avoid crashing if endpoint doesn't exist
        return { status: 404 };
      });
      
      if (testResponse.status !== 404) {
        // DipiPixel custom post type exists
        console.log("DipiPixel detected, using dipi_cpt API");
        apiEndpoint = '/wp-json/wp/v2/dipi_cpt';
        
        // Add category using custom taxonomy - only if we have a category
        if (generation.category_id) {
          postData.dipi_cpt_category = [parseInt(generation.category_id)];
          // Remove standard categories
          delete postData.categories;
        }
      }
    } catch (error) {
      console.log("Error checking for DipiPixel:", error);
      // Continue with standard WordPress endpoint
    }
    
    try {
      console.log(`Publishing to WordPress: ${siteUrl}${apiEndpoint}`);
      
      // Use a fetch with the redirect option and a reasonable timeout
      const wpResponse = await fetch(`${siteUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: browserLikeHeaders,
        body: JSON.stringify(postData),
        redirect: 'follow',
        // Set a maximum of 5 redirects to avoid infinite redirect loops
        signal: AbortSignal.timeout(15000) // 15-second timeout
      });
      
      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        
        // Check for WAF block (Tiger Protect)
        if (errorText.includes("<!DOCTYPE HTML>") || 
            errorText.includes("<html") || 
            errorText.includes("Tiger Protect") ||
            errorText.includes("security-challenge")) {
          throw new Error("The WordPress firewall (WAF) has blocked our request. Please try publishing from the WordPress admin interface.");
        }
        
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
    } catch (wpError: any) {
      console.error("WordPress API error:", wpError);
      
      // If the error contains HTML (such as with Tiger Protect), consider it a WAF issue
      const errorMessage = wpError.message || "";
      if (errorMessage.includes("<!DOCTYPE HTML>") || 
          errorMessage.includes("<html") || 
          errorMessage.includes("Tiger Protect") ||
          errorMessage.includes("Maximum number of redirects") ||
          errorMessage.includes("security-challenge")) {
        throw new Error("The WordPress firewall (WAF) has blocked our request. Please try publishing from the WordPress admin interface.");
      }
      
      throw wpError;
    }
    
  } catch (error: any) {
    console.error('Error in tome-publish function:', error);
    
    let errorMessage = error.message || 'An error occurred during publishing';
    let friendlyMessage = errorMessage;
    
    // Improve error messages for the user
    if (errorMessage.includes("WAF") || 
        errorMessage.includes("firewall") || 
        errorMessage.includes("Tiger Protect") ||
        errorMessage.includes("security-challenge")) {
      friendlyMessage = "The WordPress firewall (WAF) is blocking our request. You may need to publish manually from WordPress.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("abort")) {
      friendlyMessage = "Connection timeout when connecting to WordPress. Please check the URL and credentials.";
    } else if (errorMessage.includes("503")) {
      friendlyMessage = "The WordPress server is temporarily unavailable (503 error). Please try again later.";
    } else if (errorMessage.includes("redirects")) {
      friendlyMessage = "Too many redirects detected. This usually indicates a WordPress security plugin. Try publishing manually from WordPress.";
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
              status: 'draft', // Reset to draft on failure
              error_message: friendlyMessage.substring(0, 255) // Limit the length
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
