
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, authentication',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request data
    const requestData = await req.json();
    console.log("Request data:", requestData);

    const { announcementId, userId, categoryId } = requestData;

    if (!announcementId || !userId || !categoryId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing required fields: announcementId, userId, or categoryId",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      console.error("WARNING: App password contains spaces - may cause auth issues");
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
        { method: "HEAD" }
      );
      
      if (taxonomyResponse.status !== 404) {
        console.log("DipiPixel taxonomy endpoint found!");
        useCustomTaxonomy = true;
        
        // Check for custom post type
        console.log("Testing endpoint:", `${siteUrl}/wp-json/wp/v2/dipi_cpt`);
        const cptResponse = await fetch(
          `${siteUrl}/wp-json/wp/v2/dipi_cpt`,
          { method: "HEAD" }
        );
        
        if (cptResponse.status !== 404) {
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          customEndpointExists = true;
        } else {
          // Check alternative endpoint
          console.log("Testing endpoint:", `${siteUrl}/wp-json/wp/v2/dipicpt`);
          const altResponse = await fetch(
            `${siteUrl}/wp-json/wp/v2/dipicpt`,
            { method: "HEAD" }
          );
          
          if (altResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            customEndpointExists = true;
          } else {
            console.log("No custom post type endpoint found, falling back to posts");
          }
        }
      }
    } catch (error) {
      console.log("Error checking custom endpoints:", error);
    }

    console.log("Using WordPress endpoint:", postEndpoint);

    // Create authentication headers
    const credentials = `${wpConfig.app_username}:${wpConfig.app_password}`;
    console.log("Credentials format check: username:password");
    
    // Base64 encode the credentials
    const encodedCredentials = btoa(credentials);
    console.log("Using encoded credentials of length:", encodedCredentials.length);
    
    // Creating auth header
    console.log("Auth header created successfully using application password");
    
    // Prepare full request headers
    const headers = {
      "Content-Type": "application/json",
      "Origin": `${supabaseUrl}`,
      "Access-Control-Allow-Origin": "*",
      "Authorization": `Basic ${encodedCredentials}`
    };
    
    // Log headers without showing actual auth value
    console.log("Created headers:", JSON.stringify({...headers, "Authorization": "AUTH_HEADER_SET_BUT_NOT_DISPLAYED"}));

    // Prepare post data
    // Set categories based on endpoint type
    if (useCustomTaxonomy && customEndpointExists) {
      console.log("Using DipiPixel custom taxonomy with category ID:", categoryId);
      var postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
        dipi_cpt_category: [parseInt(categoryId)]
      };
    } else {
      console.log("Using standard WordPress categories with ID:", categoryId);
      var postData = {
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
      // Implementation for featured image upload would go here
      // This is a placeholder for now
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
    console.log("Request headers:", Object.keys(headers).join(", "));
    console.log("Request body type:", typeof postData);
    
    console.log("Attempting to send WordPress post request...");
    
    // Send the actual request
    const wpResponse = await fetch(postEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(postData)
    });

    console.log("WordPress response status:", wpResponse.status);
    
    // Process response
    if (wpResponse.status !== 201 && wpResponse.status !== 200) {
      const errorText = await wpResponse.text();
      console.log("WordPress error response:", errorText);
      return new Response(JSON.stringify({
        success: false,
        message: `WordPress API error (${wpResponse.status}): ${errorText}`,
      }), {
        status: wpResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse successful response
    const wpResponseData = await wpResponse.json();
    console.log("WordPress response parsed successfully");
    
    // Check for post ID
    if (!wpResponseData || typeof wpResponseData.id !== 'number') {
      return new Response(JSON.stringify({
        success: false,
        message: "WordPress response did not contain a valid post ID",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Post created successfully with ID:", wpResponseData.id);
    
    // Get post URL
    let postUrl = null;
    if (wpResponseData.link) {
      postUrl = wpResponseData.link;
      console.log("Post URL from response:", postUrl);
    }
    
    // Assign categories if needed
    console.log("Assigning categories to post", wpResponseData.id, { categoryId });
    
    try {
      console.log("Sending category assignment request");
      // Implementation depends on the WordPress REST API version
      // This is an example - actual implementation may vary
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
          console.log("Post verification successful");
        }
      }
      
      // Additional verification strategies could be implemented here
      
    } catch (error) {
      console.log("Error during post verification:", error);
    }
    
    // Use the verified URL or fall back to the response URL
    const finalPostUrl = verifiedPostUrl || postUrl;
    if (finalPostUrl) {
      console.log("Verified post URL:", finalPostUrl);
    }
    
    // Update the announcement record with WordPress post ID
    console.log("Updating announcement with:", {
      wordpress_post_id: wpResponseData.id,
      is_divipixel: useCustomTaxonomy && customEndpointExists,
      wordpress_post_url: finalPostUrl
    });
    
    // Check if wordpress_post_url column exists
    try {
      await supabase
        .from("announcements")
        .select("wordpress_post_url")
        .limit(1);
    } catch (error) {
      console.log("Error checking for wordpress_post_url column:", error);
      console.log("Proceeding with update without post URL");
    }
    
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: `Server error: ${error.message}`,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
