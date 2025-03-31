
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
      
      // Construct the WordPress REST API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;
      
      // Process images if any are present
      let featuredMediaId = null;
      let contentWithImages = announcement.description || "";
      
      // Prepare content with embedded images if any
      if (announcement.images && announcement.images.length > 0) {
        // Prepare images for WordPress media library
        for (const imageUrl of announcement.images) {
          try {
            // Download the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            
            const imageBlob = await imageResponse.blob();
            const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.webp`;
            
            // Create a form data object for the media upload
            const formData = new FormData();
            formData.append('file', imageBlob, fileName);
            
            // Prepare headers with authentication for media upload
            const headers: Record<string, string> = {};
            
            // Check for authentication credentials
            if (wpConfig.app_username && wpConfig.app_password) {
              // Application Password Format: "Basic base64(username:password)"
              const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
              headers['Authorization'] = `Basic ${basicAuth}`;
            } else {
              throw new Error("Aucune méthode d'authentification disponible pour WordPress");
            }
            
            // Upload the image to WordPress media library
            const mediaUploadUrl = `${siteUrl}/wp-json/wp/v2/media`;
            console.log(`Uploading image ${fileName} to WordPress media library...`);
            
            const uploadResponse = await fetch(mediaUploadUrl, {
              method: 'POST',
              headers: headers,
              body: formData
            });
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.error(`Error uploading image to WordPress: ${errorText}`);
              continue;
            }
            
            const mediaData = await uploadResponse.json();
            console.log(`Image uploaded to WordPress, ID: ${mediaData.id}, URL: ${mediaData.source_url}`);
            
            // Set first image as featured image (if not already set)
            if (featuredMediaId === null) {
              featuredMediaId = mediaData.id;
            }
            
            // Add image to content
            contentWithImages += `\n\n<img src="${mediaData.source_url}" alt="${announcement.title}" class="wp-image-${mediaData.id}" />`;
          } catch (imgError: any) {
            console.error(`Error processing image: ${imgError.message}`);
          }
        }
      }
      
      // Prepare post data with images included
      const wpPostData: any = {
        title: announcement.title,
        content: contentWithImages,
        status: announcement.status === 'published' ? 'publish' : announcement.status === 'scheduled' ? 'future' : 'draft',
        categories: [parseInt(wordpressCategoryId)]
      };
      
      // Add featured media if available
      if (featuredMediaId) {
        wpPostData.featured_media = featuredMediaId;
      }
      
      // Add date if scheduled
      if (announcement.status === 'scheduled' && announcement.publish_date) {
        wpPostData.date = new Date(announcement.publish_date).toISOString();
      }
      
      // Add SEO metadata
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
          _yoast_wpseo_focuskw: announcement.title
        };
      }
      
      console.log("WordPress post data:", wpPostData);
      
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
      console.log("WordPress response:", wpResponseData);
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && wpResponseData.id) {
        return { 
          success: true, 
          message: "Publié avec succès sur WordPress", 
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
