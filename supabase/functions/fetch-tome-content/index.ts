
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
    
    // First try to fetch as DipiPixel custom post type
    try {
      const dipiResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/dipi_cpt/${postId}`);
      
      if (dipiResponse.ok) {
        const dipiData = await dipiResponse.json();
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
      }
    } catch (error) {
      console.log("Error fetching DipiPixel content, will try standard post:", error);
    }
    
    // If not found as DipiPixel, try standard post
    try {
      const postResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/posts/${postId}`);
      
      if (postResponse.ok) {
        const postData = await postResponse.json();
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
      }
    } catch (error) {
      console.log("Error fetching standard post content, will try page:", error);
    }
    
    // If not found as post, try page
    try {
      const pageResponse = await fetch(`${formattedSiteUrl}wp-json/wp/v2/pages/${postId}`);
      
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
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
      }
    } catch (error) {
      console.log("Error fetching page content:", error);
    }
    
    // If we got here, we couldn't find the content
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Content not found'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
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
