
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishToWordPress = async (
    announcement: Announcement, 
    wordpressCategoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    
    try {
      // Get user's WordPress config
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile?.wordpress_config_id) {
        console.error("Error fetching WordPress config:", profileError || "No WordPress config ID found");
        return { 
          success: false, 
          message: "WordPress configuration non trouvée",
          wordpressPostId: null 
        };
      }
      
      // Get WordPress config details
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('id', userProfile.wordpress_config_id)
        .single();
        
      if (wpConfigError || !wpConfig) {
        console.error("Error fetching WordPress config details:", wpConfigError || "No config found");
        return { 
          success: false, 
          message: "Configuration WordPress non trouvée", 
          wordpressPostId: null 
        };
      }
      
      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Determine content type (default to post if not specified)
      const contentType = announcement.wordpress_content_type || "post";
      
      // Construct the WordPress REST API URL based on content type
      const apiUrl = `${siteUrl}/wp-json/wp/v2/${contentType === "post" ? "posts" : "pages"}`;
      
      console.log(`Publishing as WordPress ${contentType} to: ${apiUrl}`);
      
      // Prepare post data
      const wpPostData: any = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'published' ? 'publish' : announcement.status === 'scheduled' ? 'future' : 'draft',
        // Add date if scheduled
        date: announcement.status === 'scheduled' && announcement.publish_date
          ? new Date(announcement.publish_date).toISOString()
          : undefined,
        // Add SEO metadata
        meta: {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
          _yoast_wpseo_focuskw: announcement.title
        }
      };
      
      // For posts, add categories (pages have custom taxonomies)
      if (contentType === "post") {
        wpPostData.categories = [parseInt(wordpressCategoryId)];
      } else if (contentType === "page") {
        // For pages, add DiviPixel taxonomy
        wpPostData.dipi_cpt_category = [parseInt(wordpressCategoryId)];
      }
      
      console.log(`WordPress ${contentType} data:`, wpPostData);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Check for authentication credentials
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Using Application Password authentication");
      } else {
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Send request to WordPress
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("WordPress API error:", errorText);
        return { 
          success: false, 
          message: `Erreur lors de la publication WordPress (${response.status}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      const wpResponseData = await response.json();
      console.log(`WordPress ${contentType} response:`, wpResponseData);
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && wpResponseData.id) {
        return { 
          success: true, 
          message: `Publié avec succès sur WordPress en tant que ${contentType === "post" ? "article" : "page"}`, 
          wordpressPostId: wpResponseData.id 
        };
      } else {
        console.error("WordPress response does not contain post ID", wpResponseData);
        return { 
          success: false, 
          message: "La réponse WordPress ne contient pas l'ID du post", 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      return { 
        success: false, 
        message: `Erreur lors de la publication: ${error.message}`, 
        wordpressPostId: null 
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
