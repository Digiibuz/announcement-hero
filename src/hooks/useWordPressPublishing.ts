
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishToWordPress = async (
    announcement: Announcement, 
    wordpressCategoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    toast.info("Publication sur WordPress en cours...");
    
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
      
      // Determine endpoints
      let useCustomTaxonomy = false;
      let postEndpoint = `${siteUrl}/wp-json/wp/v2/pages`; // Default to pages
      
      try {
        // First try to access the dipi_cpt_category endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }).catch(() => ({ status: 404 }));
        
        clearTimeout(timeoutId);
        
        if (response && response.status !== 404) {
          useCustomTaxonomy = true;
          
          // Now check if dipi_cpt endpoint exists (with timeout)
          const dipiController = new AbortController();
          const dipiTimeoutId = setTimeout(() => dipiController.abort(), 5000);
          
          const dipiResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
            method: 'HEAD',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: dipiController.signal
          }).catch(() => ({ status: 404 }));
          
          clearTimeout(dipiTimeoutId);
          
          if (dipiResponse && dipiResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          } else {
            // Try alternative endpoint (with timeout)
            const altController = new AbortController();
            const altTimeoutId = setTimeout(() => altController.abort(), 5000);
            
            const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
              method: 'HEAD',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: altController.signal
            }).catch(() => ({ status: 404 }));
            
            clearTimeout(altTimeoutId);
            
            if (altResponse && altResponse.status !== 404) {
              postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            }
          }
        }
      } catch (error) {
        console.log("Error checking endpoints:", error);
        console.log("Falling back to standard pages endpoint");
      }
      
      console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Check for authentication credentials
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Prepare post data - simplify for mobile
      const wpPostData: any = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'published' ? 'publish' : announcement.status === 'scheduled' ? 'future' : 'draft',
      };
      
      // Add date for scheduled posts
      if (announcement.status === 'scheduled' && announcement.publish_date) {
        wpPostData.date = new Date(announcement.publish_date).toISOString();
      }
      
      // Add category based on endpoint type
      if (useCustomTaxonomy) {
        // Use the custom taxonomy for DipiPixel
        wpPostData.dipi_cpt_category = [parseInt(wordpressCategoryId)];
      }
      
      // Add SEO metadata if available - simplified
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
        };
      }
      
      // First create post without images for speed
      console.log("Sending POST request to WordPress:", postEndpoint);
      const postResponse = await fetch(postEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      if (!postResponse.ok) {
        let errorText = await postResponse.text();
        console.error("WordPress API error:", errorText);
        return { 
          success: false, 
          message: `Erreur lors de la publication WordPress (${postResponse.status}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      // Parse JSON response
      let wpResponseData;
      try {
        wpResponseData = await postResponse.json();
        console.log("WordPress response data:", wpResponseData);
      } catch (error) {
        console.error("Error parsing WordPress response:", error);
        return {
          success: false,
          message: "Erreur lors de l'analyse de la réponse WordPress",
          wordpressPostId: null
        };
      }
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && typeof wpResponseData.id === 'number') {
        const wordpressPostId = wpResponseData.id;
        console.log("WordPress post ID received:", wordpressPostId);
        
        // Update the announcement in Supabase with the WordPress post ID
        const { error: updateError } = await supabase
          .from("announcements")
          .update({ 
            wordpress_post_id: wordpressPostId,
            is_divipixel: useCustomTaxonomy 
          })
          .eq("id", announcement.id);
          
        if (updateError) {
          console.error("Error updating announcement with WordPress post ID:", updateError);
          toast.error("L'annonce a été publiée sur WordPress mais l'ID n'a pas pu être enregistré dans la base de données");
        }
        
        // Process featured image in background to avoid blocking UI
        if (announcement.images && announcement.images.length > 0) {
          // Show a notification that image processing is happening in background
          toast.info("Publication réussie. L'image principale est en cours de transfert...");
          
          // Start background process for image upload
          processImageInBackground(
            announcement.images[0], 
            announcement.title, 
            wordpressPostId, 
            postEndpoint, 
            headers
          );
        }
        
        return { 
          success: true, 
          message: "Publié avec succès sur WordPress", 
          wordpressPostId 
        };
      } else {
        console.error("WordPress response does not contain post ID or ID is not a number", wpResponseData);
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
  
  // Process image upload in background to improve mobile performance
  const processImageInBackground = async (
    imageUrl: string,
    postTitle: string,
    postId: number,
    postEndpoint: string,
    headers: Record<string, string>
  ) => {
    try {
      // 1. Download the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error("Failed to fetch image from URL:", imageUrl);
        toast.error("Échec du traitement de l'image principale");
        return;
      }
      
      const imageBlob = await imageResponse.blob();
      const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
      const imageFile = new File([imageBlob], fileName, { 
        type: imageBlob.type || 'image/jpeg' 
      });
      
      // 2. Upload to WordPress Media Library
      console.log("Uploading image to WordPress media library");
      const mediaFormData = new FormData();
      mediaFormData.append('file', imageFile);
      mediaFormData.append('title', postTitle);
      mediaFormData.append('alt_text', postTitle);
      
      const mediaEndpoint = `${postEndpoint.split('/wp-json/')[0]}/wp-json/wp/v2/media`;
      
      // Create headers for media upload without Content-Type (browser will set it with boundary)
      const mediaHeaders = new Headers();
      if (headers.Authorization) {
        mediaHeaders.append('Authorization', headers.Authorization);
      }
      
      const mediaResponse = await fetch(mediaEndpoint, {
        method: 'POST',
        headers: mediaHeaders,
        body: mediaFormData
      });
      
      if (!mediaResponse.ok) {
        const mediaErrorText = await mediaResponse.text();
        console.error("Media upload error:", mediaErrorText);
        toast.error("Image téléversée mais impossible de l'associer à l'article");
        return;
      }
      
      const mediaData = await mediaResponse.json();
      
      if (mediaData && mediaData.id) {
        // 3. Set as featured image for the post
        const updatePostEndpoint = `${postEndpoint}/${postId}`;
        
        const updateResponse = await fetch(updatePostEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            featured_media: mediaData.id
          })
        });
        
        if (!updateResponse.ok) {
          const updateErrorText = await updateResponse.text();
          console.error("Error setting featured image:", updateErrorText);
          toast.error("Image téléversée mais impossible de la définir comme image à la une");
        } else {
          toast.success("Image principale téléversée avec succès");
        }
      }
    } catch (error) {
      console.error("Error in background image processing:", error);
      toast.error("Erreur lors du traitement de l'image principale");
    }
  };
  
  return {
    publishToWordPress,
    isPublishing
  };
};
