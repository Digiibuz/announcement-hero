
// Import from URLs using the import map
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServerSupabaseClient } from "../_shared/serverClient.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface RequestPayload {
  announcementId: string;
  userId: string;
  categoryId: string;
}

/**
 * Validates the request payload and returns the validated data
 */
const validateRequest = async (req: Request): Promise<RequestPayload> => {
  // Parse request body
  const requestData = await req.json() as RequestPayload;
  const { announcementId, userId, categoryId } = requestData;

  console.log("Request data:", { announcementId, userId, categoryId });

  if (!announcementId || !userId || !categoryId) {
    console.error("Missing required fields");
    throw new Error("Paramètres manquants: announcementId, userId et categoryId sont requis");
  }

  return requestData;
};

/**
 * Fetches the announcement data from Supabase
 */
const fetchAnnouncementData = async (supabase: any, announcementId: string) => {
  const { data: announcement, error: announcementError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .single();

  if (announcementError || !announcement) {
    console.error("Error fetching announcement:", announcementError);
    throw new Error(`Annonce non trouvée: ${announcementError?.message || "Erreur inconnue"}`);
  }

  console.log("Announcement found:", announcement.title);
  return announcement;
};

/**
 * Fetches the user's WordPress configuration ID from Supabase
 */
const fetchUserWordPressConfigId = async (supabase: any, userId: string) => {
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('wordpress_config_id')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile?.wordpress_config_id) {
    console.error("Error fetching WordPress config ID:", profileError || "No WordPress config ID found");
    throw new Error("Configuration WordPress non trouvée pour l'utilisateur");
  }

  console.log("User profile found with WordPress config ID:", userProfile.wordpress_config_id);
  return userProfile.wordpress_config_id;
};

/**
 * Fetches the WordPress configuration details from Supabase
 */
const fetchWordPressConfig = async (supabase: any, configId: string) => {
  const { data: wpConfig, error: wpConfigError } = await supabase
    .from('wordpress_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (wpConfigError || !wpConfig) {
    console.error("Error fetching WordPress config details:", wpConfigError || "No config found");
    throw new Error("Détails de configuration WordPress non trouvés");
  }

  // Ensure site_url is properly formatted
  const siteUrl = wpConfig.site_url.endsWith('/') 
    ? wpConfig.site_url.slice(0, -1) 
    : wpConfig.site_url;
  
  console.log("WordPress config found:", {
    site_url: siteUrl,
    hasAppUsername: !!wpConfig.app_username,
    hasAppPassword: !!wpConfig.app_password
  });

  return { ...wpConfig, site_url: siteUrl };
};

/**
 * Detects WordPress API endpoints (standard or custom)
 */
const detectWordPressEndpoints = async (siteUrl: string) => {
  let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`;
  let useCustomTaxonomy = false;
  let isCustomPostType = false;
  
  try {
    // Check for DipiPixel custom post type
    console.log("Checking for custom endpoints...");
    const taxonomyCheckUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
    console.log("Testing endpoint:", taxonomyCheckUrl);
    
    const dipiResponse = await fetch(taxonomyCheckUrl, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => ({ status: 404 }));
    
    if (dipiResponse.status !== 404) {
      console.log("DipiPixel taxonomy endpoint found!");
      useCustomTaxonomy = true;
      
      // Check if dipi_cpt endpoint exists
      const cptCheckUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
      console.log("Testing endpoint:", cptCheckUrl);
      
      const cptResponse = await fetch(cptCheckUrl, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(() => ({ status: 404 }));
      
      if (cptResponse.status !== 404) {
        console.log("DipiPixel custom post type endpoint found!");
        postEndpoint = cptCheckUrl;
        isCustomPostType = true;
      } else {
        // Check alternative dipicpt endpoint
        const altCheckUrl = `${siteUrl}/wp-json/wp/v2/dipicpt`;
        console.log("Testing alternative endpoint:", altCheckUrl);
        
        const altResponse = await fetch(altCheckUrl, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => ({ status: 404 }));
        
        if (altResponse.status !== 404) {
          console.log("Alternative dipicpt endpoint found!");
          postEndpoint = altCheckUrl;
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

  console.log("Using WordPress endpoint:", postEndpoint);
  return { postEndpoint, useCustomTaxonomy, isCustomPostType };
};

/**
 * Creates authentication headers for WordPress API
 */
const createAuthHeaders = (wpConfig: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Set up authentication headers - CRITICAL PART - IMPROVED
  let authenticationSuccess = false;
  
  if (wpConfig.app_username && wpConfig.app_password) {
    try {
      // MÉTHODE CORRIGÉE: Utilisation correcte de l'encodage base64 pour l'authentification
      const credentials = `${wpConfig.app_username}:${wpConfig.app_password}`;
      console.log("Using credentials for:", wpConfig.app_username);
      
      // Utilisation de l'API standard pour l'encodage Base64 (compatible avec Deno)
      const encoder = new TextEncoder();
      const data = encoder.encode(credentials);
      
      // Conversion correcte en base64
      const base64Credentials = btoa(String.fromCharCode(...new Uint8Array(data)));
      
      headers['Authorization'] = `Basic ${base64Credentials}`;
      console.log("Auth header created successfully (not showing actual credentials)");
      authenticationSuccess = true;
    } catch (authError) {
      console.error("Error setting up auth headers:", authError);
      // Continue to try other auth methods
    }
  }
  
  if (!authenticationSuccess && wpConfig.rest_api_key) {
    headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
    console.log("Using REST API Key authentication");
    authenticationSuccess = true;
  }
  
  // Tentative avec les identifiants standard si disponibles
  if (!authenticationSuccess && wpConfig.username && wpConfig.password) {
    try {
      const credentials = `${wpConfig.username}:${wpConfig.password}`;
      const base64Credentials = btoa(credentials);
      headers['Authorization'] = `Basic ${base64Credentials}`;
      console.log("Using standard credentials for authentication");
      authenticationSuccess = true;
    } catch (error) {
      console.error("Error with standard credentials:", error);
    }
  }

  return { headers, authenticationSuccess };
};

/**
 * Process and upload featured image to WordPress
 */
const processImage = async (announcement: any, siteUrl: string, headers: Record<string, string>) => {
  let featuredMediaId = null;
  
  if (announcement.images && announcement.images.length > 0) {
    try {
      const imageUrl = announcement.images[0];
      console.log("Processing image:", imageUrl);
      
      // Download the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error("Failed to download image:", imageResponse.status);
        // Continue without image
      } else {
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        const imageBlob = await imageResponse.arrayBuffer();
        const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
        
        // Upload to WordPress media library
        const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
        console.log("Uploading to media endpoint:", mediaEndpoint);
        
        // Create form data (special handling for Deno)
        const formData = new FormData();
        formData.append('file', new Blob([imageBlob], { type: contentType }), fileName);
        formData.append('title', announcement.title);
        
        // Remove Content-Type for form data upload
        const uploadHeaders = { ...headers };
        delete uploadHeaders["Content-Type"];
        
        const mediaResponse = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });
        
        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text();
          console.error("Media upload failed:", mediaResponse.status, errorText);
        } else {
          const mediaData = await mediaResponse.json();
          featuredMediaId = mediaData.id;
          console.log("Media uploaded successfully, ID:", featuredMediaId);
        }
      }
    } catch (imageError) {
      console.error("Error processing image:", imageError);
      // Continue without image
    }
  }

  return featuredMediaId;
};

/**
 * Creates WordPress post data object
 */
const createPostData = (
  announcement: any, 
  categoryId: string, 
  useCustomTaxonomy: boolean, 
  isCustomPostType: boolean, 
  featuredMediaId: number | null
) => {
  // Prepare post data
  const postData: any = {
    title: announcement.title,
    content: announcement.description || "",
    status: announcement.status === 'scheduled' ? 'future' : 'publish',
  };
  
  // Add featured image if available
  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }
  
  // Add scheduled date if needed
  if (announcement.status === 'scheduled' && announcement.publish_date) {
    postData.date = new Date(announcement.publish_date).toISOString();
  }
  
  // Set category based on endpoint type
  if (useCustomTaxonomy && isCustomPostType) {
    postData.dipi_cpt_category = [parseInt(categoryId)];
  } else {
    postData.categories = [parseInt(categoryId)];
  }
  
  // Add SEO metadata if available
  if (announcement.seo_title || announcement.seo_description) {
    postData.meta = {
      _yoast_wpseo_title: announcement.seo_title || "",
      _yoast_wpseo_metadesc: announcement.seo_description || "",
    };
  }
  
  console.log("Sending post data:", JSON.stringify(postData));
  return postData;
};

/**
 * Sends the post to WordPress API
 */
const sendWordPressPost = async (
  postEndpoint: string, 
  headers: Record<string, string>, 
  postData: any
) => {
  // Send post to WordPress
  const postResponse = await fetch(postEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(postData)
  });
  
  // Handle response
  if (!postResponse.ok) {
    let errorText = await postResponse.text();
    console.error("WordPress API error:", postResponse.status, errorText);
    
    let errorMessage = "Échec de la publication sur WordPress";
    if (postResponse.status === 401) {
      errorMessage = "Erreur d'authentification WordPress: Veuillez vérifier vos identifiants";
    } else if (postResponse.status === 403) {
      errorMessage = "Accès refusé: Permissions insuffisantes dans WordPress";
    } else {
      errorMessage = `Erreur WordPress (${postResponse.status}): ${errorText.substring(0, 100)}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return await postResponse.json();
};

/**
 * Updates the announcement in Supabase with WordPress post ID
 */
const updateAnnouncementWithPostId = async (
  supabase: any, 
  announcementId: string, 
  wordpressPostId: number, 
  isCustomPostType: boolean
) => {
  const { error: updateError } = await supabase
    .from("announcements")
    .update({ 
      wordpress_post_id: wordpressPostId,
      is_divipixel: isCustomPostType
    })
    .eq("id", announcementId);
    
  if (updateError) {
    console.error("Error updating announcement with WordPress ID:", updateError);
    // We don't throw error here as post was successful
  }
};

/**
 * Main handler function for WordPress publish endpoint
 */
const handleWordPressPublish = async (req: Request) => {
  console.log("WordPress publish function called");

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ 
          code: 401, 
          message: "Missing authorization header" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();
    
    // Validate request data
    const { announcementId, userId, categoryId } = await validateRequest(req);
    
    // Fetch announcement data
    const announcement = await fetchAnnouncementData(supabase, announcementId);
    
    // Fetch user's WordPress config ID
    const wordpressConfigId = await fetchUserWordPressConfigId(supabase, userId);
    
    // Fetch WordPress config details
    const wpConfig = await fetchWordPressConfig(supabase, wordpressConfigId);
    
    // Detect WordPress API endpoints
    const { postEndpoint, useCustomTaxonomy, isCustomPostType } = 
      await detectWordPressEndpoints(wpConfig.site_url);
    
    // Create authentication headers
    const { headers, authenticationSuccess } = createAuthHeaders(wpConfig);
    
    if (!authenticationSuccess) {
      console.error("No valid authentication credentials available");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Aucune méthode d'authentification valide disponible pour WordPress. Vérifiez vos identifiants." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    // Process featured image if available
    const featuredMediaId = await processImage(announcement, wpConfig.site_url, headers);
    
    // Create WordPress post data
    const postData = createPostData(
      announcement, 
      categoryId, 
      useCustomTaxonomy, 
      isCustomPostType, 
      featuredMediaId
    );
    
    // Send post to WordPress
    const responseData = await sendWordPressPost(postEndpoint, headers, postData);
    
    console.log("WordPress response:", responseData);
    
    if (responseData && typeof responseData.id === 'number') {
      // Update announcement with WordPress ID
      await updateAnnouncementWithPostId(
        supabase, 
        announcementId, 
        responseData.id, 
        isCustomPostType
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Publication réussie sur WordPress",
          data: {
            wordpressPostId: responseData.id,
            postUrl: responseData.link || null,
            isCustomPostType
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "La réponse WordPress ne contient pas d'ID de publication" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
  } catch (error: any) {
    console.error("Error in WordPress publish function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erreur serveur: ${error.message || "Erreur inconnue"}` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
};

// Main serve function
serve(async (req) => {
  // Handling CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // Process WordPress publish request
  return handleWordPressPublish(req);
});
