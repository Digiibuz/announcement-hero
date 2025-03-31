
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { DivipixelPublication } from "@/types/divipixel";
import { toast } from "sonner";

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishToWordPress = async (
    content: Announcement | DivipixelPublication, 
    wordpressCategoryId: string,
    userId: string,
    isDivipixel: boolean = false
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
      
      // Construct the WordPress REST API URL - use dipi_cpt endpoint for Divipixel
      const apiUrl = isDivipixel 
        ? `${siteUrl}/wp-json/wp/v2/dipi_cpt` 
        : `${siteUrl}/wp-json/wp/v2/posts`;
      
      // Prepare post data
      const wpPostData = {
        title: content.title,
        content: content.description || "",
        status: content.status === 'published' ? 'publish' : content.status === 'scheduled' ? 'future' : 'draft',
        categories: [parseInt(wordpressCategoryId)],
        // Add date if scheduled
        date: content.status === 'scheduled' && content.publish_date
          ? new Date(content.publish_date).toISOString()
          : undefined,
        // Add SEO metadata
        meta: {
          _yoast_wpseo_title: content.seo_title || "",
          _yoast_wpseo_metadesc: content.seo_description || "",
          _yoast_wpseo_focuskw: content.title
        }
      };
      
      console.log(`WordPress ${isDivipixel ? 'Divipixel' : 'Post'} data:`, wpPostData);
      
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
        // Update the content in Supabase with the WordPress post ID
        const tableName = isDivipixel ? "divipixel_publications" : "announcements";
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ wordpress_post_id: wpResponseData.id })
          .eq("id", content.id);
          
        if (updateError) {
          console.error(`Error updating ${tableName} with WordPress post ID:`, updateError);
          toast.error(`Le contenu a été publié sur WordPress mais l'ID n'a pas pu être enregistré dans la base de données`);
        } else {
          console.log(`Successfully updated ${tableName} with WordPress post ID:`, wpResponseData.id);
        }
        
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
