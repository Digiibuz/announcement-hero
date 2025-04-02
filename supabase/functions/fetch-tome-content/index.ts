
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
    const { siteUrl, postId } = await req.json();

    if (!siteUrl || !postId) {
      throw new Error('Site URL and post ID are required');
    }

    console.log(`Fetching content from ${siteUrl} for post ID ${postId}`);

    // Get API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Standardize the site URL
    const formattedSiteUrl = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/';
    
    // Set timeout for fetch operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // First try to fetch as DipiPixel custom post type
    try {
      console.log(`Attempting to fetch DipiPixel content from: ${formattedSiteUrl}wp-json/wp/v2/dipi_cpt/${postId}`);
      
      const dipiResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/dipi_cpt/${postId}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TomeContentFetcher/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (dipiResponse.ok) {
        console.log("DipiPixel content found!");
        const dipiData = await dipiResponse.json();
        clearTimeout(timeoutId);
        
        return new Response(
          JSON.stringify({
            success: true,
            content: dipiData.content.rendered,
            title: dipiData.title.rendered
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        console.log(`DipiPixel request failed with status: ${dipiResponse.status}`);
        if (dipiResponse.status !== 404) {
          const errorText = await dipiResponse.text();
          console.log(`Error response: ${errorText.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log("Error fetching DipiPixel content, will try standard post:", error);
    }
    
    // If not found as DipiPixel, try standard post
    try {
      console.log(`Attempting to fetch standard post from: ${formattedSiteUrl}wp-json/wp/v2/posts/${postId}`);
      
      const postResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/posts/${postId}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TomeContentFetcher/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (postResponse.ok) {
        console.log("Standard post content found!");
        const postData = await postResponse.json();
        clearTimeout(timeoutId);
        
        return new Response(
          JSON.stringify({
            success: true,
            content: postData.content.rendered,
            title: postData.title.rendered
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        console.log(`Standard post request failed with status: ${postResponse.status}`);
        if (postResponse.status !== 404) {
          const errorText = await postResponse.text();
          console.log(`Error response: ${errorText.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log("Error fetching standard post content, will try page:", error);
    }
    
    // If not found as post, try page
    try {
      console.log(`Attempting to fetch page from: ${formattedSiteUrl}wp-json/wp/v2/pages/${postId}`);
      
      const pageResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/pages/${postId}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TomeContentFetcher/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (pageResponse.ok) {
        console.log("Page content found!");
        const pageData = await pageResponse.json();
        clearTimeout(timeoutId);
        
        return new Response(
          JSON.stringify({
            success: true,
            content: pageData.content.rendered,
            title: pageData.title.rendered
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        console.log(`Page request failed with status: ${pageResponse.status}`);
        if (pageResponse.status !== 404) {
          const errorText = await pageResponse.text();
          console.log(`Error response: ${errorText.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log("Error fetching page content:", error);
    }
    
    clearTimeout(timeoutId);
    
    // If we got here, we couldn't find the content
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Le contenu n\'a pas pu être récupéré. Le site WordPress peut temporairement bloquer notre accès. Veuillez vérifier directement sur votre site WordPress.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 with error in payload for better client handling
      }
    );
  } catch (error) {
    console.error('Error in fetch-tome-content function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while fetching content',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
