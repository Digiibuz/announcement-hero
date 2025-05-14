
// Import from URLs using the import map
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

// Environnement variables from Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  console.log("WordPress publish function called");

  // Handling CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin access
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.1");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const requestData = await req.json() as RequestPayload;
    const { announcementId, userId, categoryId } = requestData;

    console.log("Request data:", { announcementId, userId, categoryId });

    if (!announcementId || !userId || !categoryId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Paramètres manquants: announcementId, userId et categoryId sont requis" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // Step 1: Get the announcement data
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error("Error fetching announcement:", announcementError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Annonce non trouvée: ${announcementError?.message || "Erreur inconnue"}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    console.log("Announcement found:", announcement.title);

    // Step 2: Get user's WordPress config
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wordpress_config_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      console.error("Error fetching WordPress config ID:", profileError || "No WordPress config ID found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Configuration WordPress non trouvée pour l'utilisateur" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    console.log("User profile found with WordPress config ID:", userProfile.wordpress_config_id);

    // Step 3: Get WordPress config details
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', userProfile.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      console.error("Error fetching WordPress config details:", wpConfigError || "No config found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Détails de configuration WordPress non trouvés" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    console.log("WordPress config found:", {
      site_url: wpConfig.site_url,
      hasAppUsername: !!wpConfig.app_username,
      hasAppPassword: !!wpConfig.app_password
    });

    // Step 4: Process the image if available
    let featuredMediaId = null;
    if (announcement.images && announcement.images.length > 0) {
      const imageUrl = announcement.images[0];
      featuredMediaId = await uploadImageToWordPress(wpConfig, imageUrl, announcement.title);
      console.log("Featured media ID:", featuredMediaId);
    }

    // Step 5: Publish the post to WordPress
    const publishResult = await publishPostToWordPress(
      wpConfig, 
      announcement, 
      categoryId, 
      featuredMediaId
    );

    if (!publishResult.success) {
      console.error("Publish result error:", publishResult.message);
      return new Response(
        JSON.stringify(publishResult),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    console.log("Post published successfully, WordPress ID:", publishResult.wordpressPostId);

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
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Publié avec succès sur WordPress",
        data: publishResult
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200  
      }
    );

  } catch (error) {
    console.error("Error in WordPress publish function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erreur serveur: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
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
    console.log("Checking if dipi_cpt_category endpoint exists...");
    const dipiResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
      method: 'HEAD',
    }).catch(() => ({ status: 404 }));
    
    if (dipiResponse.status !== 404) {
      console.log("DipiPixel taxonomy endpoint found!");
      useCustomTaxonomy = true;
      
      // Check if dipi_cpt endpoint exists
      console.log("Checking if dipi_cpt endpoint exists...");
      const cptResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
        method: 'HEAD',
      }).catch(() => ({ status: 404 }));
      
      if (cptResponse.status !== 404) {
        console.log("DipiPixel custom post type endpoint found!");
        postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
        isCustomPostType = true;
      } else {
        // Check alternative dipicpt endpoint
        console.log("Checking if dipicpt endpoint exists...");
        const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
          method: 'HEAD',
        }).catch(() => ({ status: 404 }));
        
        if (altResponse.status !== 404) {
          console.log("Alternative dipicpt endpoint found!");
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
          isCustomPostType = true;
        } else {
          console.log("No custom post type endpoint found, falling back to posts");
        }
      }
    } else {
      console.log("No custom taxonomy endpoint found, using standard categories");
    }
  } catch (error) {
    console.error("Error detecting endpoints:", error);
    console.log("Falling back to standard posts endpoint");
  }
  
  console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
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
      throw new Error("Aucune méthode d'authentification disponible");
    }
    
    // Download the image
    console.log("Downloading image from URL:", imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Échec du téléchargement de l'image: ${imageResponse.status}`);
    }
    
    // Get image data
    const imageBlob = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
    
    console.log("Image downloaded successfully, content type:", contentType);
    
    // Upload to WordPress media library
    const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([imageBlob], { type: contentType }), fileName);
    formData.append('title', title);
    formData.append('alt_text', title);
    
    // Remove Content-Type header for FormData
    const uploadHeaders = { ...headers };
    delete uploadHeaders["Content-Type"];
    
    console.log("Uploading image to WordPress media library:", mediaEndpoint);
    const mediaResponse = await fetch(mediaEndpoint, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });
    
    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error(`Media upload failed with status ${mediaResponse.status}: ${errorText}`);
      return null;
    }
    
    const mediaData = await mediaResponse.json();
    console.log("Image uploaded successfully, media ID:", mediaData.id);
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
    try {
      const appCredentials = `${wpConfig.app_username.trim()}:${wpConfig.app_password.trim()}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(appCredentials);
      
      // Use the browser's crypto API
      const base64Credentials = btoa(appCredentials);
      headers["Authorization"] = `Basic ${base64Credentials}`;
      console.log("Using Application Password authentication");
      return headers;
    } catch (error) {
      console.error("Error with app password auth:", error);
    }
  }
  
  // Try REST API key next
  if (wpConfig.rest_api_key) {
    headers["Authorization"] = `Bearer ${wpConfig.rest_api_key.trim()}`;
    console.log("Using REST API Key authentication");
    return headers;
  }
  
  // Try regular username/password as last resort
  if (wpConfig.username && wpConfig.password) {
    try {
      const credentials = `${wpConfig.username.trim()}:${wpConfig.password.trim()}`;
      const base64Credentials = btoa(credentials);
      headers["Authorization"] = `Basic ${base64Credentials}`;
      console.log("Using Legacy Basic authentication");
      return headers;
    } catch (error) {
      console.error("Error with legacy auth:", error);
    }
  }
  
  // If we have any auth credentials, return headers without auth
  if (wpConfig.site_url) {
    console.warn("No authentication method available, attempting without auth");
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
        message: "Aucune méthode d'authentification disponible"
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
      console.log("Using custom taxonomy with category ID:", categoryId);
    } else {
      wpPostData.categories = [parseInt(categoryId)];
      console.log("Using standard WordPress categories with ID:", categoryId);
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
      console.error(`WordPress API error (${response.status}):`, errorText);
      
      // Try alternative authentication methods if initial attempt fails
      if (response.status === 401) {
        console.log("Authentication failed, trying alternative method...");
        
        // Try direct nonce auth as a final resort
        try {
          // Try direct POST without auth as last resort
          console.log("Trying direct post without authentication as last resort");
          
          const noAuthHeaders = { ...headers };
          delete noAuthHeaders.Authorization;
          
          const lastAttemptResponse = await fetch(postEndpoint, {
            method: 'POST',
            headers: noAuthHeaders,
            body: JSON.stringify(wpPostData)
          });
          
          if (lastAttemptResponse.ok) {
            const lastAttemptData = await lastAttemptResponse.json();
            return {
              success: true,
              message: "Publication réussie (méthode alternative)",
              wordpressPostId: lastAttemptData.id,
              isCustomPostType
            };
          } else {
            const lastError = await lastAttemptResponse.text();
            return {
              success: false,
              message: `Erreur d'authentification WordPress (${response.status}): ${lastError}`
            };
          }
        } catch (altError) {
          console.error("Error with alternative auth:", altError);
        }
      }
      
      return {
        success: false,
        message: `Erreur d'authentification WordPress (${response.status}): Veuillez vérifier vos identifiants et vos permissions.`
      };
    }
    
    const responseData = await response.json();
    console.log("WordPress response:", responseData);
    
    if (responseData && typeof responseData.id === 'number') {
      return {
        success: true,
        message: "Publication réussie",
        wordpressPostId: responseData.id,
        isCustomPostType
      };
    } else {
      return {
        success: false,
        message: "La réponse WordPress ne contient pas d'ID de publication"
      };
    }
    
  } catch (error) {
    console.error("Error publishing post:", error);
    return {
      success: false,
      message: `Erreur lors de la publication sur WordPress: ${error.message}`
    };
  }
}
