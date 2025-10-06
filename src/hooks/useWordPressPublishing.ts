import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";
import { useImageCompression } from "./useImageCompression";

export type PublishingStatus = "idle" | "loading" | "success" | "error";

export interface PublishingState {
  currentStep: string | null;
  steps: {
    [key: string]: {
      status: PublishingStatus;
      message?: string;
    }
  };
  progress: number;
}

const initialPublishingState: PublishingState = {
  currentStep: null,
  steps: {
    prepare: { status: "idle" },
    compress: { status: "idle" },
    wordpress: { status: "idle" },
    database: { status: "idle" }
  },
  progress: 0
};

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingState, setPublishingState] = useState<PublishingState>(initialPublishingState);
  const { compressImage } = useImageCompression();
  
  const updatePublishingStep = (stepId: string, status: PublishingStatus, message?: string, progress?: number) => {
    setPublishingState(prev => ({
      ...prev,
      currentStep: stepId,
      steps: {
        ...prev.steps,
        [stepId]: { status, message: message || prev.steps[stepId]?.message }
      },
      progress: progress !== undefined ? progress : prev.progress
    }));
  };
  
  const resetPublishingState = () => {
    setPublishingState(initialPublishingState);
  };
  
  const publishToWordPress = async (
    announcement: Announcement, 
    wordpressCategoryId: string,
    userId: string,
    currentFormData?: { socialContent?: string; socialHashtags?: string[] }
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();
    
    const isUpdate = announcement.wordpress_post_id && announcement.wordpress_post_id > 0;
    const actionText = isUpdate ? "Mise à jour" : "Publication";
    
    // Start with preparation
    updatePublishingStep("prepare", "loading", `${actionText} - Préparation`, 10);
    
    try {
      // Get user's WordPress config
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile?.wordpress_config_id) {
        console.error("Error fetching WordPress config:", profileError || "No WordPress config ID found");
        updatePublishingStep("prepare", "error", "Configuration WordPress non trouvée");
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
        updatePublishingStep("prepare", "error", "Configuration WordPress non trouvée");
        return { 
          success: false, 
          message: "Configuration WordPress non trouvée", 
          wordpressPostId: null 
        };
      }
      
      // Define siteUrl here for use throughout the function
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 25);
      
      // Process main featured image
      let featuredMediaId = null;
      
      if (announcement.images && announcement.images.length > 0) {
        try {
          updatePublishingStep("compress", "loading", "Compression de l'image principale", 35);
          
          // Compression légère WebP vers JPEG pour WordPress
          const compressedImageUrl = await compressImage(announcement.images[0], {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.9,
            format: 'jpeg'
          });
          
          // Convert blob URL to file for WordPress upload
          const response = await fetch(compressedImageUrl);
          const blob = await response.blob();
          const imageFile = new File([blob], `${announcement.title}-featured.jpg`, { 
            type: 'image/jpeg' 
          });
          
          // Upload to WordPress media library
          console.log("Uploading featured image to WordPress");
          const mediaFormData = new FormData();
          mediaFormData.append('file', imageFile);
          mediaFormData.append('title', `${announcement.title} - Image principale`);
          mediaFormData.append('alt_text', announcement.title);
          
          const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
          
          const mediaHeaders = new Headers();
          if (wpConfig.app_username && wpConfig.app_password) {
            const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
            mediaHeaders.append('Authorization', `Basic ${basicAuth}`);
          }
          
          const mediaResponse = await fetch(mediaEndpoint, {
            method: 'POST',
            headers: mediaHeaders,
            body: mediaFormData
          });
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData && mediaData.id) {
              featuredMediaId = mediaData.id;
              updatePublishingStep("compress", "success", "Image principale téléversée", 45);
            }
          } else {
            console.error("Featured image upload failed");
            updatePublishingStep("compress", "error", "Échec du téléversement de l'image principale");
          }
          
          // Clean up blob URL
          URL.revokeObjectURL(compressedImageUrl);
          
        } catch (error) {
          console.error("Error processing featured image:", error);
          updatePublishingStep("compress", "error", "Erreur lors du traitement de l'image principale");
        }
      }

      // Process additional medias with improved styling
      let additionalMediasContent = "";
      const additionalMedias = (announcement as any).additionalMedias || [];
      
      if (additionalMedias.length > 0) {
        try {
          updatePublishingStep("compress", "loading", "Traitement des médias additionnels", 50);
          
          const mediaPromises = additionalMedias.map(async (mediaUrl: string, index: number) => {
            try {
              // Determine if it's an image or video
              const isVideo = mediaUrl.toLowerCase().includes('.mp4') || 
                            mediaUrl.toLowerCase().includes('.webm') || 
                            mediaUrl.toLowerCase().includes('.mov');
              
              if (isVideo) {
                // For videos, upload directly without compression
                const videoResponse = await fetch(mediaUrl);
                const videoBlob = await videoResponse.blob();
                const videoFile = new File([videoBlob], `${announcement.title}-video-${index + 1}.mp4`, { 
                  type: 'video/mp4' 
                });
                
                const videoFormData = new FormData();
                videoFormData.append('file', videoFile);
                videoFormData.append('title', `${announcement.title} - Vidéo ${index + 1}`);
                
                const videoUploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
                  method: 'POST',
                  headers: new Headers({
                    'Authorization': `Basic ${btoa(`${wpConfig.app_username}:${wpConfig.app_password}`)}`
                  }),
                  body: videoFormData
                });
                
                if (videoUploadResponse.ok) {
                  const videoData = await videoUploadResponse.json();
                  return `
                    <div style="margin: 30px 0; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #e9ecef;">
                      <video controls style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <source src="${videoData.source_url}" type="video/mp4">
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    </div>
                  `;
                }
              } else {
                // For images, compress and upload
                const compressedUrl = await compressImage(mediaUrl, {
                  maxWidth: 1200,
                  maxHeight: 1200,
                  quality: 0.85,
                  format: 'jpeg'
                });
                
                const imageResponse = await fetch(compressedUrl);
                const imageBlob = await imageResponse.blob();
                const imageFile = new File([imageBlob], `${announcement.title}-image-${index + 1}.jpg`, { 
                  type: 'image/jpeg' 
                });
                
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                imageFormData.append('title', `${announcement.title} - Image ${index + 1}`);
                imageFormData.append('alt_text', `${announcement.title} - Image ${index + 1}`);
                
                const imageUploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
                  method: 'POST',
                  headers: new Headers({
                    'Authorization': `Basic ${btoa(`${wpConfig.app_username}:${wpConfig.app_password}`)}`
                  }),
                  body: imageFormData
                });
                
                if (imageUploadResponse.ok) {
                  const imageData = await imageUploadResponse.json();
                  return `
                    <div style="margin: 30px 0; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #e9ecef;">
                      <img src="${imageData.source_url}" 
                           alt="${announcement.title} - Image ${index + 1}" 
                           style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
                    </div>
                  `;
                }
                
                // Clean up blob URL
                URL.revokeObjectURL(compressedUrl);
              }
            } catch (error) {
              console.error(`Error processing additional media ${index + 1}:`, error);
              return null;
            }
            
            return null;
          });
          
          const processedMedias = await Promise.all(mediaPromises);
          const validMedias = processedMedias.filter(media => media !== null);
          
          if (validMedias.length > 0) {
            additionalMediasContent = `
              <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e9ecef;">
                <h3 style="color: #495057; font-size: 1.2em; margin-bottom: 20px; text-align: center; font-weight: 600;">Médias additionnels</h3>
                ${validMedias.join('')}
              </div>
            `;
            updatePublishingStep("compress", "success", `${validMedias.length} média(s) additionnel(s) traité(s)`, 60);
          } else {
            updatePublishingStep("compress", "success", "Médias additionnels traités", 60);
          }
          
        } catch (error) {
          console.error("Error processing additional medias:", error);
          updatePublishingStep("compress", "error", "Erreur lors du traitement des médias additionnels");
        }
      } else {
        updatePublishingStep("compress", "success", "Aucun média additionnel à traiter", 60);
      }
      
      // WordPress publication
      updatePublishingStep("wordpress", "loading", `${actionText} sur WordPress`, 70);
      
      // Determine endpoints - silently check for custom post type
      let useCustomTaxonomy = false;
      let postEndpoint = `${siteUrl}/wp-json/wp/v2/pages`;
      
      // Helper function to silently check if an endpoint exists
      const checkEndpoint = async (url: string): Promise<boolean> => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(url, {
            method: 'HEAD',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          return response.status !== 404;
        } catch (error) {
          // Silently return false for any error (404, timeout, network error, etc.)
          return false;
        }
      };
      
      try {
        // Check if custom taxonomy exists
        const hasTaxonomy = await checkEndpoint(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`);
        
        if (hasTaxonomy) {
          useCustomTaxonomy = true;
          
          // Check for custom post type endpoints in order of preference
          const hasMainCPT = await checkEndpoint(`${siteUrl}/wp-json/wp/v2/dipi_cpt`);
          if (hasMainCPT) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          } else {
            const hasAltCPT = await checkEndpoint(`${siteUrl}/wp-json/wp/v2/dipicpt`);
            if (hasAltCPT) {
              postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            }
          }
        }
      } catch (error) {
        // Fallback to default pages endpoint
        console.log("Using default WordPress pages endpoint");
      }
      
      console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
      
      if (isUpdate) {
        postEndpoint = `${postEndpoint}/${announcement.wordpress_post_id}`;
      }
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Check for authentication credentials
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        updatePublishingStep("wordpress", "error", "Aucune méthode d'authentification disponible");
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Prepare post data with additional medias integrated into content
      const baseContent = announcement.description || "";
      const fullContent = baseContent + additionalMediasContent;
      
      const wpPostData: any = {
        title: announcement.title,
        content: fullContent,
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
      };
      
      // Set featured image (including removal for updates)
      if (featuredMediaId !== null) {
        wpPostData.featured_media = featuredMediaId;
      }
      
      // Add date for scheduled posts
      if (announcement.status === 'scheduled' && announcement.publish_date) {
        wpPostData.date = new Date(announcement.publish_date).toISOString();
      }
      
      // Add category based on endpoint type
      if (useCustomTaxonomy) {
        wpPostData.dipi_cpt_category = [parseInt(wordpressCategoryId)];
      }
      
      // Add SEO metadata if available
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
        };
      }
      
      // Create or update post
      const httpMethod = isUpdate ? 'PUT' : 'POST';
      console.log(`Sending ${httpMethod} request to WordPress:`, postEndpoint);
      console.log("WordPress post data:", wpPostData);
      
      const postResponse = await fetch(postEndpoint, {
        method: httpMethod,
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      if (!postResponse.ok) {
        let errorText = await postResponse.text();
        console.error("WordPress API error:", errorText);
        updatePublishingStep("wordpress", "error", `Erreur lors du ${actionText.toLowerCase()}`);
        return { 
          success: false, 
          message: `Erreur lors du ${actionText.toLowerCase()} WordPress (${postResponse.status}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      // Parse JSON response
      let wpResponseData;
      try {
        wpResponseData = await postResponse.json();
        console.log("WordPress response data:", wpResponseData);
        updatePublishingStep("wordpress", "success", `${actionText} WordPress réussie`, 85);
      } catch (error) {
        console.error("Error parsing WordPress response:", error);
        updatePublishingStep("wordpress", "error", "Erreur d'analyse de la réponse");
        return {
          success: false,
          message: "Erreur lors de l'analyse de la réponse WordPress",
          wordpressPostId: null
        };
      }
      
      // Final database update
      updatePublishingStep("database", "loading", "Mise à jour de la base de données", 90);
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && typeof wpResponseData.id === 'number') {
        const wordpressPostId = wpResponseData.id;
        console.log("WordPress post ID received:", wordpressPostId);
        
        // Calculate the WordPress URL
        let wordpressUrl;
        if (announcement.seo_slug) {
          wordpressUrl = `${siteUrl}/${announcement.seo_slug}`;
        } else {
          wordpressUrl = `${siteUrl}/?p=${wordpressPostId}`;
        }
        
        // Update the announcement in Supabase with the WordPress post ID and URL
        const updateData: any = {
          is_divipixel: useCustomTaxonomy,
          wordpress_url: wordpressUrl
        };
        
        // Only update wordpress_post_id for new posts
        if (!isUpdate) {
          updateData.wordpress_post_id = wordpressPostId;
        }
        
        const { error: updateError } = await supabase
          .from("announcements")
          .update(updateData)
          .eq("id", announcement.id);
          
        if (updateError) {
          console.error("Error updating announcement with WordPress data:", updateError);
          updatePublishingStep("database", "error", "Erreur de mise à jour de la base de données");
        } else {
          updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
        }
        
        const additionalMediasCount = additionalMedias.length;
        const successMessage = `${actionText} avec succès sur WordPress` + 
                              (featuredMediaId ? " avec image principale" : "") +
                              (additionalMediasCount > 0 ? ` et ${additionalMediasCount} média(s) additionnel(s)` : "");
        
        // Note: Publication Facebook sera gérée via l'API Meta directement
        
        return { 
          success: true, 
          message: successMessage, 
          wordpressPostId 
        };
      } else {
        console.error("WordPress response does not contain post ID", wpResponseData);
        updatePublishingStep("database", "error", "Données incomplètes");
        return { 
          success: false, 
          message: "La réponse WordPress ne contient pas l'ID du post", 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      if (publishingState.currentStep) {
        updatePublishingStep(publishingState.currentStep, "error", `Erreur: ${error.message}`);
      }
      return { 
        success: false, 
        message: `Erreur lors du ${isUpdate ? 'mise à jour' : 'publication'}: ${error.message}`, 
        wordpressPostId: null 
      };
    } finally {
      setIsPublishing(false);
    }
  };
  
  return {
    publishToWordPress,
    isPublishing,
    publishingState,
    resetPublishingState
  };
};
