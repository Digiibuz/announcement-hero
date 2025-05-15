
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
  try {
    // Parse request body
    const requestData = await req.json() as RequestPayload;
    const { announcementId, userId, categoryId } = requestData;

    console.log("Request data:", { announcementId, userId, categoryId });

    if (!announcementId || !userId || !categoryId) {
      console.error("Missing required fields");
      throw new Error("Paramètres manquants: announcementId, userId et categoryId sont requis");
    }

    return requestData;
  } catch (error) {
    console.error("Error validating request:", error);
    throw new Error(`Erreur de validation de la requête: ${error.message}`);
  }
};

/**
 * Fetches the announcement data from Supabase
 */
const fetchAnnouncementData = async (supabase: any, announcementId: string) => {
  try {
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
  } catch (error) {
    console.error("Error fetching announcement data:", error);
    throw new Error(`Erreur lors de la récupération de l'annonce: ${error.message}`);
  }
};

/**
 * Fetches the user's WordPress configuration ID from Supabase
 */
const fetchUserWordPressConfigId = async (supabase: any, userId: string) => {
  try {
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
  } catch (error) {
    console.error("Error fetching WordPress config ID:", error);
    throw new Error(`Erreur lors de la récupération de la configuration WordPress: ${error.message}`);
  }
};

/**
 * Fetches the WordPress configuration details from Supabase
 */
const fetchWordPressConfig = async (supabase: any, configId: string) => {
  try {
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
  } catch (error) {
    console.error("Error fetching WordPress config:", error);
    throw new Error(`Erreur lors de la récupération des détails de configuration WordPress: ${error.message}`);
  }
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
    
    // Using fetch with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const dipiResponse = await fetch(taxonomyCheckUrl, {
      method: 'HEAD',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    }).catch(err => {
      console.log("Error checking taxonomy endpoint:", err);
      return { status: 404 };
    });
    
    clearTimeout(timeoutId);
    
    if (dipiResponse.status !== 404) {
      console.log("DipiPixel taxonomy endpoint found!");
      useCustomTaxonomy = true;
      
      // Check primary custom endpoint
      const cptEndpoints = [
        `${siteUrl}/wp-json/wp/v2/dipi_cpt`,
        `${siteUrl}/wp-json/wp/v2/dipicpt`
      ];
      
      for (const endpoint of cptEndpoints) {
        console.log("Testing endpoint:", endpoint);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(endpoint, {
            method: 'HEAD',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.status !== 404) {
            console.log(`Custom post type endpoint found: ${endpoint}`);
            postEndpoint = endpoint;
            isCustomPostType = true;
            break;
          }
        } catch (err) {
          console.log(`Error checking endpoint ${endpoint}:`, err);
        }
      }
      
      if (!isCustomPostType) {
        console.log("No custom post type endpoint found, falling back to posts");
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
 * Create proper authentication headers for WordPress API
 * Fixing base64 encoding and properly handling credentials
 */
const createAuthHeaders = (wpConfig: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let authenticationSuccess = false;
  
  // Application password method (preferred)
  if (wpConfig.app_username && wpConfig.app_password) {
    try {
      // Properly create base64 credentials with explicit trimming
      const appUsername = String(wpConfig.app_username).trim();
      const appPassword = String(wpConfig.app_password).trim();
      
      if (appUsername && appPassword) {
        const credentials = `${appUsername}:${appPassword}`;
        console.log("Using application password for:", appUsername);
        
        // Proper base64 encoding for Deno
        const encoder = new TextEncoder();
        const data = encoder.encode(credentials);
        const base64Credentials = btoa(String.fromCharCode(...new Uint8Array(data)));
        
        headers['Authorization'] = `Basic ${base64Credentials}`;
        console.log("Auth header created successfully using application password");
        authenticationSuccess = true;
      } else {
        console.error("Application credentials are empty after trimming");
      }
    } catch (authError) {
      console.error("Error setting up application password auth:", authError);
    }
  }
  
  // REST API key method (fallback)
  if (!authenticationSuccess && wpConfig.rest_api_key) {
    const apiKey = String(wpConfig.rest_api_key).trim();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log("Using REST API Key authentication");
      authenticationSuccess = true;
    } else {
      console.error("REST API key is empty after trimming");
    }
  }
  
  // Standard username/password (last resort)
  if (!authenticationSuccess && wpConfig.username && wpConfig.password) {
    try {
      const username = String(wpConfig.username).trim();
      const password = String(wpConfig.password).trim();
      
      if (username && password) {
        const credentials = `${username}:${password}`;
        
        // Proper base64 encoding for Deno
        const encoder = new TextEncoder();
        const data = encoder.encode(credentials);
        const base64Credentials = btoa(String.fromCharCode(...new Uint8Array(data)));
        
        headers['Authorization'] = `Basic ${base64Credentials}`;
        console.log("Using standard credentials for authentication");
        authenticationSuccess = true;
      } else {
        console.error("Standard credentials are empty after trimming");
      }
    } catch (error) {
      console.error("Error with standard credentials:", error);
    }
  }

  // Log headers for debugging (excluding actual credential values)
  const debugHeaders = {...headers};
  if (debugHeaders['Authorization']) {
    debugHeaders['Authorization'] = 'AUTH_HEADER_SET_BUT_NOT_DISPLAYED';
  }
  console.log("Created headers:", JSON.stringify(debugHeaders));

  if (!authenticationSuccess) {
    console.error("No valid authentication credentials available");
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
      
      // Download the image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const imageResponse = await fetch(imageUrl, { signal: controller.signal })
        .catch(err => {
          console.error("Failed to fetch image:", err);
          return { ok: false };
        });
      
      clearTimeout(timeoutId);
      
      if (!imageResponse.ok) {
        console.error("Failed to download image:", imageResponse.status);
        return null;
      }

      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      const imageBlob = await imageResponse.arrayBuffer();
      const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
      
      // Upload to WordPress media library
      const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
      console.log("Uploading to media endpoint:", mediaEndpoint);
      
      // Create form data for Deno
      const formData = new FormData();
      formData.append('file', new Blob([imageBlob], { type: contentType }), fileName);
      formData.append('title', announcement.title || "Image");
      
      // Remove Content-Type for form data upload
      const uploadHeaders = { ...headers };
      delete uploadHeaders["Content-Type"];
      
      // Upload with timeout
      const uploadController = new AbortController();
      const uploadTimeoutId = setTimeout(() => uploadController.abort(), 15000);
      
      const mediaResponse = await fetch(mediaEndpoint, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData,
        signal: uploadController.signal
      }).catch(err => {
        console.error("Media upload error:", err);
        return { ok: false };
      });
      
      clearTimeout(uploadTimeoutId);
      
      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error("Media upload failed:", mediaResponse.status, errorText);
        return null;
      }
      
      const mediaData = await mediaResponse.json();
      featuredMediaId = mediaData.id;
      console.log("Media uploaded successfully, ID:", featuredMediaId);
    } catch (imageError) {
      console.error("Error processing image:", imageError);
      return null;
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
    // For DipiPixel
    postData.dipi_cpt_category = [parseInt(categoryId)];
    console.log("Using custom taxonomy with category ID:", categoryId);
  } else {
    // Standard WP categories
    postData.categories = [parseInt(categoryId)];
    console.log("Using standard WordPress categories with ID:", categoryId);
  }
  
  // Add SEO metadata if available
  if (announcement.seo_title || announcement.seo_description) {
    postData.meta = {
      _yoast_wpseo_title: announcement.seo_title || "",
      _yoast_wpseo_metadesc: announcement.seo_description || "",
    };
  }
  
  console.log("Prepared post data:", JSON.stringify(postData, null, 2));
  return postData;
};

/**
 * Sends the post to WordPress API with improved error handling
 */
const sendWordPressPost = async (
  postEndpoint: string, 
  headers: Record<string, string>, 
  postData: any
) => {
  try {
    console.log("Sending WordPress request to:", postEndpoint);
    console.log("With headers:", Object.keys(headers).join(", "));
    
    // Create a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    // Send post to WordPress
    const postResponse = await fetch(postEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(postData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle error responses
    if (!postResponse.ok) {
      let errorText = await postResponse.text();
      console.error("WordPress API error:", postResponse.status, errorText);
      
      // Format specific error messages based on status code
      let errorMessage = "Échec de la publication sur WordPress";
      if (postResponse.status === 401) {
        errorMessage = "Erreur d'authentification WordPress: Vos identifiants ne sont pas acceptés par le site WordPress. Veuillez vérifier vos identifiants d'application WordPress dans votre profil.";
      } else if (postResponse.status === 403) {
        errorMessage = "Accès refusé par WordPress: Votre compte n'a pas les permissions nécessaires pour publier des articles.";
      } else {
        errorMessage = `Erreur WordPress (${postResponse.status}): ${errorText.substring(0, 100)}`;
      }
      
      throw new Error(errorMessage);
    }
    
    return await postResponse.json();
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === "AbortError") {
      throw new Error("La requête vers WordPress a expiré. Veuillez vérifier que votre site WordPress est accessible.");
    }
    console.error("Error in WordPress post request:", error);
    throw error;
  }
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
  try {
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
  } catch (error) {
    console.error("Error updating announcement:", error);
  }
};

/**
 * Main handler function for WordPress publish endpoint
 */
const handleWordPressPublish = async (req: Request) => {
  console.log("WordPress publish function called");

  try {
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
          message: "Aucune méthode d'authentification valide disponible pour WordPress. Veuillez vérifier vos identifiants dans votre profil." 
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
        message: `Erreur d'authentification WordPress: Veuillez vérifier vos identifiants` 
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
  
  try {
    // Process WordPress publish request
    return await handleWordPressPublish(req);
  } catch (error) {
    console.error("Unhandled error in server function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Erreur serveur interne" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
