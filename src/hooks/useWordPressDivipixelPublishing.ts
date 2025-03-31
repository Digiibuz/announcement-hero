
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";

export const useWordPressDivipixelPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishToDivipixel = async (
    announcement: Announcement, 
    divipixelCategoryId: string,
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
      
      // Construct the WordPress REST API URL for Divipixel CPT
      const apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
      
      // Prepare post data
      const wpPostData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'published' ? 'publish' : announcement.status === 'scheduled' ? 'future' : 'draft',
        dipi_cpt_category: [parseInt(divipixelCategoryId)],
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
      
      console.log("Divipixel post data:", wpPostData);
      
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
          message: `Erreur lors de la publication Divipixel (${response.status}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      const wpResponseData = await response.json();
      console.log("Divipixel response:", wpResponseData);
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && wpResponseData.id) {
        // Update the announcement in Supabase with the WordPress post ID
        const { error: updateError } = await supabase
          .from("announcements")
          .update({ 
            wordpress_post_id: wpResponseData.id,
            is_divipixel: true
          })
          .eq("id", announcement.id);
          
        if (updateError) {
          console.error("Error updating announcement with Divipixel post ID:", updateError);
          toast.error("La publication a été publiée sur Divipixel mais l'ID n'a pas pu être enregistré dans la base de données");
        } else {
          console.log("Successfully updated announcement with Divipixel post ID:", wpResponseData.id);
        }
        
        return { 
          success: true, 
          message: "Publié avec succès sur Divipixel", 
          wordpressPostId: wpResponseData.id 
        };
      } else {
        console.error("Divipixel response does not contain post ID", wpResponseData);
        return { 
          success: false, 
          message: "La réponse Divipixel ne contient pas l'ID du post", 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Error publishing to Divipixel:", error);
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
    publishToDivipixel,
    isPublishing
  };
};
