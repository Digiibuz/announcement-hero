
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

export interface PublishToWordPressResult {
  success: boolean;
  message: string;
  wordpressPostId?: number;
}

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);

  const getWordPressConfig = async (userId: string, wordpressConfigId?: string) => {
    try {
      // Get user profile to find related WordPress config
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get WordPress configuration ID
      const configId = wordpressConfigId || userProfile.wordpress_config_id;
      
      if (!configId) {
        throw new Error("Aucune configuration WordPress associée à cet utilisateur");
      }

      // Get WordPress configuration
      const { data: wordpressConfig, error: configError } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('id', configId)
        .single();

      if (configError) throw configError;
      
      return wordpressConfig;
    } catch (error) {
      console.error("Error getting WordPress config:", error);
      throw error;
    }
  };

  const formatAnnouncementForWordPress = (announcement: Announcement) => {
    // Format the announcement data for WordPress
    // Handling the publishing date for scheduled posts
    let date = undefined;
    if (announcement.status === 'scheduled' && announcement.publish_date) {
      date = new Date(announcement.publish_date).toISOString();
    }

    const status = announcement.status === 'published' ? 'publish' : 
                  announcement.status === 'scheduled' ? 'future' : 'draft';
    
    // Create basic post data
    const postData: any = {
      title: announcement.title,
      content: announcement.description || "",
      status: status,
      categories: [parseInt(announcement.wordpress_category_id || "0")],
    };

    // Add date for scheduled posts
    if (date && status === 'future') {
      postData.date = date;
    }

    // Add SEO data if available
    if (announcement.seo_title) {
      postData.yoast_title = announcement.seo_title;
    }
    
    if (announcement.seo_description) {
      postData.yoast_meta = announcement.seo_description;
    }
    
    if (announcement.seo_slug) {
      postData.slug = announcement.seo_slug;
    }
    
    return postData;
  };

  const attachImagesToWordPress = async (
    postId: number, 
    images: string[], 
    siteUrl: string, 
    username: string, 
    password: string
  ) => {
    try {
      if (!images || images.length === 0) {
        return { success: true, message: "No images to attach" };
      }
      
      // Process each image
      for (const imageUrl of images) {
        // Get image data
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        
        // Create form data
        const formData = new FormData();
        formData.append('file', blob, `image_${Date.now()}.jpg`);
        
        // Upload to WordPress
        const uploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`),
          },
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Error uploading image:", errorText);
          continue; // Try the next image
        }
        
        const mediaData = await uploadResponse.json();
        
        // Attach image to post
        await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            featured_media: mediaData.id,
          }),
        });
      }
      
      return { success: true, message: "Images attached successfully" };
    } catch (error) {
      console.error("Error attaching images:", error);
      return { success: false, message: "Error attaching images" };
    }
  };
  
  const publishToWordPress = async (
    announcement: Announcement, 
    categoryId: string, 
    userId: string
  ): Promise<PublishToWordPressResult> => {
    setIsPublishing(true);
    
    try {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }
      
      // Ensure the announcement has the WordPress category ID
      const announcementWithCategory = {
        ...announcement,
        wordpress_category_id: categoryId
      };
      
      // Get WordPress configuration
      const wordpressConfig = await getWordPressConfig(userId);
      
      if (!wordpressConfig) {
        return { success: false, message: "Configuration WordPress introuvable" };
      }
      
      if (!wordpressConfig.site_url || !wordpressConfig.app_username || !wordpressConfig.app_password) {
        return { 
          success: false, 
          message: "Configuration WordPress incomplète (URL du site, nom d'utilisateur ou mot de passe manquant)" 
        };
      }
      
      // Format the announcement data for WordPress
      const postData = formatAnnouncementForWordPress(announcementWithCategory);
      
      const url = `${wordpressConfig.site_url}/wp-json/wp/v2/posts`;
      const username = wordpressConfig.app_username;
      const password = wordpressConfig.app_password;
      
      console.log("Publication sur WordPress:", { url, postData });
      
      // Send the POST request to WordPress
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        },
        body: JSON.stringify(postData),
      });
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error publishing to WordPress:", errorText);
        return { 
          success: false, 
          message: `Erreur de publication WordPress: ${response.status} ${response.statusText}` 
        };
      }
      
      // Get the response data
      const responseData = await response.json();

      console.log("Publication WordPress réussie:", responseData);
      
      // CRITICAL FIX: Update the announcement in Supabase with the WordPress post ID
      if (responseData && responseData.id) {
        console.log("Mise à jour de l'annonce dans Supabase avec l'ID WordPress:", responseData.id);
        
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ wordpress_post_id: responseData.id })
          .eq('id', announcement.id);
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour de l'annonce avec l'ID WordPress:", updateError);
          // Continue despite error, but log it
        } else {
          console.log("Annonce mise à jour avec l'ID WordPress avec succès");
        }
      } else {
        console.error("Pas d'ID WordPress reçu dans la réponse");
      }
      
      // Attach images if available
      if (announcement.images && announcement.images.length > 0 && responseData.id) {
        await attachImagesToWordPress(
          responseData.id, 
          announcement.images, 
          wordpressConfig.site_url,
          username,
          password
        );
      }
      
      return { 
        success: true, 
        message: "Publication WordPress réussie",
        wordpressPostId: responseData.id
      };
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}` 
      };
    } finally {
      setIsPublishing(false);
    }
  };
  
  const deleteFromWordPress = async (userId: string, wordpressPostId?: number | null): Promise<PublishToWordPressResult> => {
    try {
      if (!userId) {
        return { 
          success: false, 
          message: "Utilisateur non identifié" 
        };
      }

      if (!wordpressPostId) {
        console.error("No WordPress post ID provided", wordpressPostId);
        return {
          success: false,
          message: "Aucun ID de post WordPress fourni"
        };
      }
      
      // Get WordPress configuration
      const wordpressConfig = await getWordPressConfig(userId);
      
      if (!wordpressConfig) {
        return { success: false, message: "Configuration WordPress introuvable" };
      }
      
      if (!wordpressConfig.site_url || !wordpressConfig.app_username || !wordpressConfig.app_password) {
        return { 
          success: false, 
          message: "Configuration WordPress incomplète" 
        };
      }
      
      const url = `${wordpressConfig.site_url}/wp-json/wp/v2/posts/${wordpressPostId}?force=true`;
      const username = wordpressConfig.app_username;
      const password = wordpressConfig.app_password;
      
      console.log("Suppression du post WordPress:", { url, wordpressPostId });
      
      // Send the DELETE request to WordPress
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        },
      });
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error deleting WordPress post:", errorText);
        return { 
          success: false, 
          message: `Erreur de suppression WordPress: ${response.status} ${response.statusText}` 
        };
      }
      
      // Get the response data
      const responseData = await response.json();
      
      console.log("Suppression WordPress réussie:", responseData);
      
      return { 
        success: true, 
        message: "Suppression WordPress réussie" 
      };
    } catch (error: any) {
      console.error("Error deleting from WordPress:", error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}` 
      };
    }
  };

  return {
    publishToWordPress,
    deleteFromWordPress,
    isPublishing
  };
};
