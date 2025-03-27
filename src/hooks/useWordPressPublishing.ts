import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

interface PublishToWordPressResult {
  success: boolean;
  message: string;
  wordpressPostId?: number;
}

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishToWordPress = async (
    announcement: Announcement, 
    wpCategoryId: string,
    userId: string
  ): Promise<PublishToWordPressResult> => {
    if (!userId) {
      console.error("No user ID provided");
      return { 
        success: false, 
        message: "User not identified" 
      };
    }

    try {
      setIsPublishing(true);
      console.log("Retrieving WordPress configuration...");
      
      // Get WordPress config from the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error retrieving user profile:", profileError);
        throw new Error("User profile not found");
      }

      if (!userProfile?.wordpress_config_id) {
        console.error("WordPress configuration not found for this user");
        throw new Error("WordPress configuration not found");
      }
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, username, password, rest_api_key, app_username, app_password')
        .eq('id', userProfile.wordpress_config_id)
        .single();

      if (wpConfigError) {
        console.error("Error retrieving WordPress configuration:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        throw new Error("WordPress configuration not found");
      }

      console.log("WordPress configuration retrieved:", {
        site_url: wpConfig.site_url,
        hasAppCredentials: !!(wpConfig.app_username && wpConfig.app_password),
        hasRestApiKey: !!wpConfig.rest_api_key,
      });

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Construct the WordPress API URL for posts
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;
      console.log("WordPress API URL:", apiUrl);
      
      // Format the content correctly
      const content = announcement.description || "";
      
      // Determine publication status
      let status = 'draft';
      if (announcement.status === 'published') {
        status = 'publish';
      } else if (announcement.status === 'scheduled' && announcement.publish_date) {
        status = 'future';
      }
      
      // Prepare post data
      const postData = {
        title: announcement.title,
        content: content,
        status: status,
        categories: [parseInt(wpCategoryId)],
        date: announcement.status === 'scheduled' ? announcement.publish_date : undefined
      };
      
      console.log("Publication data:", {
        title: postData.title,
        status: postData.status,
        categoryId: wpCategoryId,
        hasDate: !!postData.date
      });
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Priority of authentication: Application Password > REST API Key > Basic Auth
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Using Application Password authentication");
      } else if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
        console.log("Using REST API Key authentication");
      } else if (wpConfig.username && wpConfig.password) {
        const basicAuth = btoa(`${wpConfig.username}:${wpConfig.password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Using basic authentication (not recommended)");
      } else {
        throw new Error("No WordPress authentication method available");
      }
      
      console.log("Sending request to WordPress...");
      
      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        // Send request to WordPress
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(postData),
          signal: controller.signal,
          credentials: 'omit' // Don't send cookies to avoid CORS issues
        });
        
        clearTimeout(timeoutId);

        console.log("Response status:", response.status);
        
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        // Try to parse as JSON if possible
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          // Not JSON, keep as text
          responseData = responseText;
        }

        if (!response.ok) {
          console.error("WordPress publishing error:", responseData);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("WordPress authentication failed or insufficient permissions. Your WordPress account needs 'Editor' or 'Administrator' role.");
          }
          
          throw new Error(`Failed to publish to WordPress: ${response.status} ${response.statusText}`);
        }

        console.log("WordPress publishing successful:", responseData);
        return { 
          success: true, 
          message: "WordPress publishing successful",
          wordpressPostId: responseData?.id 
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out when publishing to WordPress. The site may be slow or unreachable.");
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      return { 
        success: false, 
        message: `WordPress publishing error: ${error.message}` 
      };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishToWordPress,
    isPublishing
  };
};
