
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Get request body
    const { title, content, metaDescription, categoryId, status } = await req.json();
    
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Le titre et le contenu sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Publishing content: "${title}" to category ${categoryId} with status ${status}`);

    // Get the user's WordPress config
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('wordpress_config_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      throw new Error('Configuration WordPress non trouvée pour cet utilisateur');
    }

    // Get the WordPress config details
    const { data: wpConfig, error: wpConfigError } = await supabaseClient
      .from('wordpress_configs')
      .select('*')
      .eq('id', userProfile.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      throw new Error('Configuration WordPress introuvable');
    }

    // Ensure site_url has proper format
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;

    // Check authentication credentials
    if (!wpConfig.app_username || !wpConfig.app_password) {
      throw new Error("Identifiants de connexion WordPress manquants");
    }

    // Prepare authentication
    const auth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
    
    // Prepare headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    };

    // Determine endpoint and data structure (supporting DipiPixel CPT if available)
    const isDigipixelSite = await checkIsDipiPixelSite(siteUrl, headers);
    const endpoint = isDigipixelSite
      ? `${siteUrl}/wp-json/wp/v2/dipi_cpt`
      : `${siteUrl}/wp-json/wp/v2/posts`;

    // Prepare post data
    const postData: any = {
      title,
      content,
      status: status === 'publish' ? 'publish' : 'draft',
    };

    // Add category based on site type
    if (isDigipixelSite) {
      postData.dipi_cpt_category = [parseInt(categoryId)];
    } else {
      postData.categories = [parseInt(categoryId)];
    }

    // Add SEO metadata
    if (metaDescription) {
      postData.meta = {
        _yoast_wpseo_metadesc: metaDescription
      };
    }

    console.log(`Publishing to endpoint: ${endpoint}`);

    // Send request to WordPress
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      let errorMessage = `Erreur WordPress (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += `: ${await response.text()}`;
      }
      throw new Error(errorMessage);
    }

    const wpResponse = await response.json();
    console.log(`Published successfully, post ID: ${wpResponse.id}`);

    // Save the post in Supabase announcements table for reference
    await supabaseClient.from('announcements').insert({
      title,
      description: content,
      user_id: user.id,
      status: status === 'publish' ? 'published' : 'draft',
      wordpress_post_id: wpResponse.id,
      is_divipixel: isDigipixelSite,
      wordpress_category: categoryId,
      seo_description: metaDescription
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: wpResponse.id,
        postUrl: wpResponse.link || null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error publishing content:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur s'est produite lors de la publication" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to check if site is a DipiPixel site with custom post types
async function checkIsDipiPixelSite(siteUrl: string, headers: Record<string, string>): Promise<boolean> {
  try {
    // First try to access the dipi_cpt_category endpoint
    const categoryEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
    const response = await fetch(categoryEndpoint, {
      method: 'HEAD',
      headers
    });
    
    return response.status !== 404;
  } catch (error) {
    console.error("Error checking if site is DipiPixel:", error);
    return false;
  }
}
