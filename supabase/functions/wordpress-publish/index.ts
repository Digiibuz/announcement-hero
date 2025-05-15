
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

serve(async (req) => {
  console.log("WordPress publish function called");

  // Handling CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérification de l'authentification
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
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

    // Initialize Supabase client with service role for admin access
    const supabase = createServerSupabaseClient();

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

    // Ensure site_url is properly formatted
    const siteUrl = wpConfig.site_url.endsWith('/') 
      ? wpConfig.site_url.slice(0, -1) 
      : wpConfig.site_url;
    
    console.log("WordPress config found:", {
      site_url: siteUrl,
      hasAppUsername: !!wpConfig.app_username,
      hasAppPassword: !!wpConfig.app_password
    });

    // Detect WordPress API endpoints
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
    
    // Authenticate with WordPress - CORRECTION DU PROBLEME D'AUTHENTIFICATION
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
    
    // Step 4: Process the image if available
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
    
    // Step 5: Create WordPress post
    console.log("Creating WordPress post...");
    
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
      
      return new Response(
        JSON.stringify({ success: false, message: errorMessage }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    const responseData = await postResponse.json();
    console.log("WordPress response:", responseData);
    
    if (responseData && typeof responseData.id === 'number') {
      // Step 6: Update announcement with WordPress ID
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ 
          wordpress_post_id: responseData.id,
          is_divipixel: isCustomPostType
        })
        .eq("id", announcementId);
        
      if (updateError) {
        console.error("Error updating announcement with WordPress ID:", updateError);
      }
      
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
});
