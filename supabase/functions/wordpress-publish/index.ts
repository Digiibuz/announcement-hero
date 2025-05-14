
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

interface RequestPayload {
  announcementId: string;
  userId: string;
  categoryId: string;
}

interface WordPressConfig {
  site_url: string;
  app_username: string | null;
  app_password: string | null;
  rest_api_key: string | null;
  username: string | null;
  password: string | null;
}

// Environment variables from Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request JSON
    const { announcementId, userId, categoryId } = await req.json() as RequestPayload;
    
    if (!announcementId || !userId || !categoryId) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Step 1: Get the announcement data
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();
      
    if (announcementError || !announcement) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Announcement not found: ${announcementError?.message || "Unknown error"}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Step 2: Get user's WordPress config
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wordpress_config_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "WordPress configuration not found for user" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Step 3: Get WordPress config details
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', userProfile.wordpress_config_id)
      .single();
      
    if (wpConfigError || !wpConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "WordPress configuration details not found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Step 4: Process the image if available
    let featuredMediaId = null;
    if (announcement.images && announcement.images.length > 0) {
      const imageUrl = announcement.images[0];
      featuredMediaId = await uploadImageToWordPress(wpConfig, imageUrl, announcement.title);
    }
    
    // Step 5: Publish the post to WordPress
    const publishResult = await publishPostToWordPress(
      wpConfig, 
      announcement, 
      categoryId, 
      featuredMediaId
    );
    
    if (!publishResult.success) {
      return new Response(
        JSON.stringify(publishResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Step 6: Update the announcement record with WordPress ID
    if (publishResult.wordpressPostId) {
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ 
          wordpress_post_id: publishResult.wordpressPostId,
          is_divipixel: publishResult.isCustomPostType
        })
        .eq("id", announcementId);
        
      if (updateError) {
        console.error("Error updating announcement:", updateError);
        // Don't fail the whole request if just the update fails
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Published successfully to WordPress",
        data: publishResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in WordPress publish function:", error);
    return new Response(
      JSON.stringify({ success: false, message: `Server error: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to detect endpoints
async function detectWordPressEndpoints(siteUrl: string): Promise<{
  postEndpoint: string;
  useCustomTaxonomy: boolean;
  isCustomPostType: boolean;
}> {
  // Remove trailing slash if present
  siteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  
  // Default values
  let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`;
  let useCustomTaxonomy = false;
  let isCustomPostType = false;
  
  try {
    // Check for DipiPixel custom post type
    const dipiResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, { method: 'HEAD' });
    
    if (dipiResponse.status !== 404) {
      useCustomTaxonomy = true;
      
      // Check if dipi_cpt endpoint exists
      const cptResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, { method: 'HEAD' });
      
      if (cptResponse.status !== 404) {
        postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
        isCustomPostType = true;
      } else {
        // Check alternative dipicpt endpoint
        const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, { method: 'HEAD' });
        
        if (altResponse.status !== 404) {
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
          isCustomPostType = true;
        }
      }
    }
  } catch (error) {
    console.error("Error detecting endpoints:", error);
    // Fallback to default posts endpoint
  }
  
  return { postEndpoint, useCustomTaxonomy, isCustomPostType };
}

// Helper function to upload an image to WordPress
async function uploadImageToWordPress(
  wpConfig: WordPressConfig, 
  imageUrl: string, 
  title: string
): Promise<number | null> {
  try {
    // Clean site URL
    const siteUrl = wpConfig.site_url.endsWith('/') ? wpConfig.site_url.slice(0, -1) : wpConfig.site_url;
    
    // Setup authentication headers
    const headers = await getAuthHeaders(wpConfig);
    if (!headers) {
      throw new Error("No authentication headers available");
    }
    
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    // Get image data
    const imageBlob = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
    
    // Upload to WordPress media library
    const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
    
    // Remove Content-Type header for FormData
    const uploadHeaders = { ...headers };
    delete uploadHeaders["Content-Type"];
    
    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([imageBlob], { type: contentType }), fileName);
    formData.append('title', title);
    formData.append('alt_text', title);
    
    const mediaResponse = await fetch(mediaEndpoint, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });
    
    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      throw new Error(`Media upload failed: ${mediaResponse.status} ${errorText}`);
    }
    
    const mediaData = await mediaResponse.json();
    return mediaData.id;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null; // Return null on error, post will be published without image
  }
}

// Helper function to get auth headers
async function getAuthHeaders(wpConfig: WordPressConfig): Promise<Record<string, string> | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Try app password first (most reliable)
  if (wpConfig.app_username && wpConfig.app_password) {
    const appCredentials = `${wpConfig.app_username.trim()}:${wpConfig.app_password.trim()}`;
    headers["Authorization"] = `Basic ${btoa(appCredentials)}`;
    return headers;
  }
  
  // Try REST API key next
  if (wpConfig.rest_api_key) {
    headers["Authorization"] = `Bearer ${wpConfig.rest_api_key.trim()}`;
    return headers;
  }
  
  // Try regular username/password as last resort
  if (wpConfig.username && wpConfig.password) {
    const credentials = `${wpConfig.username.trim()}:${wpConfig.password.trim()}`;
    headers["Authorization"] = `Basic ${btoa(credentials)}`;
    return headers;
  }
  
  return null;
}

// Helper function to publish post to WordPress
async function publishPostToWordPress(
  wpConfig: WordPressConfig,
  announcement: any,
  categoryId: string,
  featuredMediaId: number | null
): Promise<{
  success: boolean;
  message: string;
  wordpressPostId?: number;
  isCustomPostType?: boolean;
}> {
  try {
    // Clean site URL
    const siteUrl = wpConfig.site_url.endsWith('/') ? wpConfig.site_url.slice(0, -1) : wpConfig.site_url;
    
    // Detect endpoints
    const { postEndpoint, useCustomTaxonomy, isCustomPostType } = await detectWordPressEndpoints(siteUrl);
    
    // Get authentication headers
    const headers = await getAuthHeaders(wpConfig);
    if (!headers) {
      return {
        success: false,
        message: "No authentication method available"
      };
    }
    
    // Prepare post data
    const wpPostData: any = {
      title: announcement.title,
      content: announcement.description || "",
      status: announcement.status === 'scheduled' ? 'future' : 'publish',
    };
    
    // Add featured image if available
    if (featuredMediaId) {
      wpPostData.featured_media = featuredMediaId;
    }
    
    // Add scheduled date if needed
    if (announcement.status === 'scheduled' && announcement.publish_date) {
      wpPostData.date = new Date(announcement.publish_date).toISOString();
    }
    
    // Set category based on endpoint type
    if (useCustomTaxonomy && isCustomPostType) {
      wpPostData.dipi_cpt_category = [parseInt(categoryId)];
    } else {
      wpPostData.categories = [parseInt(categoryId)];
    }
    
    // Add SEO metadata if available
    if (announcement.seo_title || announcement.seo_description) {
      wpPostData.meta = {
        _yoast_wpseo_title: announcement.seo_title || "",
        _yoast_wpseo_metadesc: announcement.seo_description || "",
      };
    }
    
    console.log("Publishing to endpoint:", postEndpoint);
    console.log("Post data:", JSON.stringify(wpPostData));
    
    // Send the request to WordPress
    const response = await fetch(postEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(wpPostData)
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `WordPress API error (${response.status}): ${errorText}`
      };
    }
    
    const responseData = await response.json();
    
    if (responseData && typeof responseData.id === 'number') {
      return {
        success: true,
        message: "Published successfully",
        wordpressPostId: responseData.id,
        isCustomPostType
      };
    } else {
      return {
        success: false,
        message: "WordPress response missing post ID"
      };
    }
    
  } catch (error) {
    console.error("Error publishing post:", error);
    return {
      success: false,
      message: `Error publishing to WordPress: ${error.message}`
    };
  }
}
