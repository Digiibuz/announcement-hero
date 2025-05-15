
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { corsHeaders } from "../_shared/cors.ts";

// Setup Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  console.log("WordPress publish function called");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check for proper request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        success: false,
        message: "Method not allowed",
      }), {
        status: 405,
        headers: { ...corsHeaders },
      });
    }

    // Parse request data with robust error handling
    let requestData;
    try {
      const requestText = await req.text();
      console.log("Request raw text:", requestText);
      
      if (!requestText || requestText.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          message: "Empty request body",
        }), {
          status: 400,
          headers: { ...corsHeaders },
        });
      }
      
      requestData = JSON.parse(requestText);
      console.log("Request data parsed successfully:", requestData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return new Response(JSON.stringify({
        success: false,
        message: `Invalid JSON format: ${parseError.message}`,
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    const { announcementId, userId, categoryId } = requestData;

    if (!announcementId || !userId || !categoryId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing required fields: announcementId, userId, or categoryId",
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    // Fetch announcement data
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error("Error fetching announcement:", announcementError);
      return new Response(JSON.stringify({
        success: false,
        message: `Announcement not found: ${announcementError?.message || "Unknown error"}`,
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("Announcement found:", announcement.title);

    // Get user's WordPress config
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("wordpress_config_id")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({
        success: false,
        message: `User profile not found: ${profileError?.message || "No WordPress configuration found"}`,
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("User profile found with WordPress config ID:", userProfile.wordpress_config_id);

    // Get WordPress config details
    const { data: wpConfig, error: configError } = await supabase
      .from("wordpress_configs")
      .select("*")
      .eq("id", userProfile.wordpress_config_id)
      .single();

    if (configError || !wpConfig) {
      console.error("Error fetching WordPress config:", configError);
      return new Response(JSON.stringify({
        success: false,
        message: `WordPress configuration not found: ${configError?.message || "Unknown error"}`,
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("WordPress config found:", {
      site_url: wpConfig.site_url,
      hasAppUsername: !!wpConfig.app_username,
      hasAppPassword: !!wpConfig.app_password
    });

    // Verify WordPress credentials
    if (!wpConfig.app_username || !wpConfig.app_password) {
      return new Response(JSON.stringify({
        success: false,
        message: "WordPress credentials missing. Please set up application passwords in WordPress configuration.",
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    // Credentials format check
    console.log("WordPress Credentials Format Check:");
    console.log("App username exists:", !!wpConfig.app_username);
    console.log("App username type:", typeof wpConfig.app_username);
    console.log("App username length:", wpConfig.app_username.length);
    console.log("App password exists:", !!wpConfig.app_password);
    console.log("App password type:", typeof wpConfig.app_password);
    console.log("App password length:", wpConfig.app_password.length);
    
    // Warning for potential issues
    if (wpConfig.app_password.includes(" ")) {
      console.log("WARNING: App password contains spaces - this is normal for application passwords");
    }

    // Format site URL
    const siteUrl = wpConfig.site_url.endsWith("/")
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;

    // Check for custom endpoints
    console.log("Checking for custom endpoints...");

    // First check for custom taxonomies
    let useCustomTaxonomy = false;
    let customEndpointExists = false;
    let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`;

    try {
      console.log("Testing endpoint:", `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`);
      const taxonomyResponse = await fetch(
        `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`,
        { 
          method: "HEAD",
          headers: { 
            "Origin": supabaseUrl,
            "Access-Control-Request-Method": "HEAD"
          }
        }
      );
      
      console.log("Taxonomy response status:", taxonomyResponse.status);
      
      if (taxonomyResponse.status !== 404) {
        console.log("DipiPixel taxonomy endpoint found!");
        useCustomTaxonomy = true;
        
        // Check for custom post type
        console.log("Testing endpoint:", `${siteUrl}/wp-json/wp/v2/dipi_cpt`);
        const cptResponse = await fetch(
          `${siteUrl}/wp-json/wp/v2/dipi_cpt`,
          { 
            method: "HEAD",
            headers: { 
              "Origin": supabaseUrl,
              "Access-Control-Request-Method": "HEAD"
            }
          }
        );
        
        console.log("Custom post type response status:", cptResponse.status);
        
        if (cptResponse.status !== 404) {
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          customEndpointExists = true;
          console.log("Using dipi_cpt endpoint");
        } else {
          // Check alternative endpoint
          console.log("Testing endpoint:", `${siteUrl}/wp-json/wp/v2/dipicpt`);
          const altResponse = await fetch(
            `${siteUrl}/wp-json/wp/v2/dipicpt`,
            { 
              method: "HEAD",
              headers: { 
                "Origin": supabaseUrl,
                "Access-Control-Request-Method": "HEAD"
              }
            }
          );
          
          console.log("Alternative endpoint response status:", altResponse.status);
          
          if (altResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            customEndpointExists = true;
            console.log("Using dipicpt endpoint");
          } else {
            console.log("No custom post type endpoint found, falling back to posts");
          }
        }
      } else {
        console.log("No DipiPixel taxonomy found, using standard categories");
      }
    } catch (error) {
      console.log("Error checking custom endpoints:", error);
      console.log("Falling back to standard posts endpoint");
    }

    console.log("Using WordPress endpoint:", postEndpoint);

    // Create authentication headers
    const credentials = `${wpConfig.app_username}:${wpConfig.app_password}`;
    console.log("Credentials format:", "username:password");
    
    // Base64 encode the credentials
    const encodedCredentials = btoa(credentials);
    console.log("Using encoded credentials of length:", encodedCredentials.length);
    
    // Creating auth header
    console.log("Auth header created successfully using application password");
    
    // Prepare full request headers
    const headers = {
      "Content-Type": "application/json",
      "Origin": `${supabaseUrl}`,
      "Authorization": `Basic ${encodedCredentials}`
    };
    
    // Log headers without showing actual auth value
    console.log("Created headers:", JSON.stringify({...headers, "Authorization": "AUTH_HEADER_SET_BUT_NOT_DISPLAYED"}));

    // Prepare post data
    // Set categories based on endpoint type
    let postData;
    if (useCustomTaxonomy && customEndpointExists) {
      console.log("Using DipiPixel custom taxonomy with category ID:", categoryId);
      postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
        dipi_cpt_category: [parseInt(categoryId)]
      };
    } else {
      console.log("Using standard WordPress categories with ID:", categoryId);
      postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
        categories: [parseInt(categoryId)]
      };
    }

    // Add scheduled date if needed
    if (announcement.status === 'scheduled' && announcement.publish_date) {
      postData.date = new Date(announcement.publish_date).toISOString();
    }

    // Add featured image if available
    if (announcement.images && announcement.images.length > 0) {
      console.log("Image available in announcement, will attempt to upload after post creation");
      // Implementation for featured image upload will be done after post creation
    }

    // Add SEO metadata if available
    if (announcement.seo_title || announcement.seo_description) {
      postData.meta = {
        _yoast_wpseo_title: announcement.seo_title || "",
        _yoast_wpseo_metadesc: announcement.seo_description || ""
      };
    }

    console.log("Prepared post data:", JSON.stringify(postData, null, 2));
    
    // Send request to WordPress
    console.log("Sending WordPress request to:", postEndpoint);
    console.log("With headers:", Object.keys(headers).join(", "));
    console.log("Request method: POST");
    
    console.log("Attempting to send WordPress post request...");
    
    // Send the actual request
    let wpResponse;
    try {
      wpResponse = await fetch(postEndpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(postData)
      });

      console.log("WordPress response status:", wpResponse.status);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({
        success: false,
        message: `Network error: ${fetchError.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }
    
    // Process response
    if (wpResponse.status !== 201 && wpResponse.status !== 200) {
      let errorText;
      try {
        errorText = await wpResponse.text();
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      console.log("WordPress error response:", errorText);
      return new Response(JSON.stringify({
        success: false,
        message: `WordPress API error (${wpResponse.status}): ${errorText}`,
        details: { status: wpResponse.status }
      }), {
        status: wpResponse.status >= 400 && wpResponse.status < 600 ? wpResponse.status : 500,
        headers: { ...corsHeaders },
      });
    }

    // Parse successful response with robust error handling
    let wpResponseData;
    try {
      wpResponseData = await wpResponse.json();
      console.log("WordPress response parsed successfully");
    } catch (parseError) {
      console.error("Error parsing WordPress response:", parseError);
      return new Response(JSON.stringify({
        success: false,
        message: `Error parsing WordPress response: ${parseError.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }
    
    // Check for post ID
    if (!wpResponseData || typeof wpResponseData.id !== 'number') {
      return new Response(JSON.stringify({
        success: false,
        message: "WordPress response did not contain a valid post ID",
        response: wpResponseData
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }

    console.log("Post created successfully with ID:", wpResponseData.id);
    
    // Get post URL
    let postUrl = null;
    if (wpResponseData.link) {
      postUrl = wpResponseData.link;
      console.log("Post URL from response:", postUrl);
    }
    
    // Feature image if available
    if (announcement.images && announcement.images.length > 0 && wpResponseData.id) {
      try {
        console.log("Attempting to set featured image");
        const imageUrl = announcement.images[0];
        console.log("Image URL:", imageUrl);
        
        // First, download the image
        let imageResponse;
        try {
          imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
          }
        } catch (imageError) {
          console.error("Error downloading image:", imageError);
          // Continue with post creation, just log the error
        }
        
        if (imageResponse && imageResponse.ok) {
          // Get image as blob
          const imageBlob = await imageResponse.blob();
          
          // Create form data for media upload
          const formData = new FormData();
          formData.append('file', new File([imageBlob], 'featured-image.jpg', { type: imageBlob.type || 'image/jpeg' }));
          
          // Upload to WordPress media library
          const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
          console.log("Uploading to media endpoint:", mediaEndpoint);
          
          const mediaResponse = await fetch(mediaEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': headers.Authorization
            },
            body: formData
          });
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData && mediaData.id) {
              console.log("Media uploaded successfully with ID:", mediaData.id);
              
              // Set as featured image
              const updatePostEndpoint = `${postEndpoint}/${wpResponseData.id}`;
              const updateResponse = await fetch(updatePostEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  featured_media: mediaData.id
                })
              });
              
              if (updateResponse.ok) {
                console.log("Featured image set successfully");
              } else {
                console.error("Failed to set featured image:", await updateResponse.text());
              }
            }
          } else {
            console.error("Failed to upload media:", await mediaResponse.text());
          }
        }
      } catch (mediaError) {
        console.error("Error handling featured image:", mediaError);
        // Continue with post creation, just log the error
      }
    }
    
    // Assign categories if needed
    console.log("Assigning categories to post", wpResponseData.id, { categoryId });
    
    try {
      console.log("Sending category assignment request");
      // Implementation depends on the WordPress REST API version
      const categoryAssignUrl = `${postEndpoint}/${wpResponseData.id}`;
      const categoryData = useCustomTaxonomy && customEndpointExists
          ? { dipi_cpt_category: [parseInt(categoryId)] }
          : { categories: [parseInt(categoryId)] };
            
      const catResponse = await fetch(categoryAssignUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(categoryData)
      });
      
      if (catResponse.ok) {
        console.log("Categories successfully assigned to post");
      } else {
        console.log("Category assignment response:", await catResponse.text());
      }
    } catch (error) {
      console.log("Error assigning categories:", error);
    }
    
    // Verify post was published successfully
    console.log("Verifying post publication for ID", wpResponseData.id + "...");
    
    let verifiedPostUrl = null;
    
    try {
      // Strategy 1: Direct API verification
      console.log("Strategy 1: Trying direct API verification...");
      const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/${useCustomTaxonomy && customEndpointExists ? 'dipi_cpt' : 'posts'}/${wpResponseData.id}`, {
        method: "GET",
        headers: headers
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log("Post verification data:", verifyData);
        
        if (verifyData && verifyData.status === "publish" && verifyData.link) {
          console.log("Post verified and published at:", verifyData.link);
          verifiedPostUrl = verifyData.link;
          console.log("Post verification succeeded with strategy 1");
        }
      } else {
        console.log("Verification failed with status:", verifyResponse.status);
      }
      
    } catch (error) {
      console.log("Error during post verification:", error);
    }
    
    // Use the verified URL or fall back to the response URL
    const finalPostUrl = verifiedPostUrl || postUrl;
    if (finalPostUrl) {
      console.log("Final post URL:", finalPostUrl);
    }
    
    // Update the announcement record with WordPress post ID
    console.log("Updating announcement with:", {
      wordpress_post_id: wpResponseData.id,
      is_divipixel: useCustomTaxonomy && customEndpointExists,
      wordpress_post_url: finalPostUrl
    });
    
    // Update the announcement record
    const { error: updateError } = await supabase
      .from("announcements")
      .update({
        wordpress_post_id: wpResponseData.id,
        is_divipixel: useCustomTaxonomy && customEndpointExists
      })
      .eq("id", announcementId);
    
    if (updateError) {
      console.log("Error updating announcement record:", updateError);
      return new Response(JSON.stringify({
        success: true,
        message: "Post published to WordPress but failed to update local record",
        data: { wordpressPostId: wpResponseData.id, postUrl: finalPostUrl, isCustomPostType: useCustomTaxonomy && customEndpointExists }
      }), {
        status: 207, // Partial success
        headers: { ...corsHeaders },
      });
    }
    
    console.log("Successfully updated announcement record with WordPress post ID:", wpResponseData.id);
    
    // Return success response
    console.log("WordPress publication process completed successfully");
    return new Response(JSON.stringify({
      success: true,
      message: "Publication réussie sur WordPress",
      data: {
        wordpressPostId: wpResponseData.id,
        postUrl: finalPostUrl,
        isCustomPostType: useCustomTaxonomy && customEndpointExists
      }
    }), {
      status: 200,
      headers: { ...corsHeaders },
    });
    
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: `Server error: ${error.message || "Unknown error"}`,
    }), {
      status: 500,
      headers: { ...corsHeaders },
    });
  }
});
