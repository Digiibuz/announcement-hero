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
    media: { status: "idle" },
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

  const isVideo = (url: string) => {
    return /\.(mp4|mov|avi|mkv|webm)$/i.test(url);
  };
  
  const publishToWordPress = async (
    announcement: Announcement, 
    wordpressCategoryId: string,
    userId: string
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
      
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 25);
      
      // Process media files
      let featuredMediaId = null;
      let additionalMediaIds: number[] = [];
      
      if (announcement.images && announcement.images.length > 0) {
        updatePublishingStep("media", "loading", "Traitement des médias", 40);
        
        try {
          for (let i = 0; i < announcement.images.length; i++) {
            const mediaUrl = announcement.images[i];
            let processedBlob: Blob;
            let fileName: string;
            let mimeType: string;
            
            if (isVideo(mediaUrl)) {
              // Pour les vidéos, pas de compression
              const response = await fetch(mediaUrl);
              processedBlob = await response.blob();
              const extension = mediaUrl.split('.').pop()?.toLowerCase() || 'mp4';
              fileName = `${announcement.title}-video-${i + 1}.${extension}`;
              mimeType = `video/${extension}`;
            } else {
              // Pour les images, compression légère
              const compressedImageUrl = await compressImage(mediaUrl, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.9,
                format: 'jpeg'
              });
              
              const response = await fetch(compressedImageUrl);
              processedBlob = await response.blob();
              fileName = `${announcement.title}-image-${i + 1}.jpg`;
              mimeType = 'image/jpeg';
              
              // Clean up blob URL
              URL.revokeObjectURL(compressedImageUrl);
            }
            
            // Upload to WordPress media library
            const mediaFormData = new FormData();
            const mediaFile = new File([processedBlob], fileName, { type: mimeType });
            mediaFormData.append('file', mediaFile);
            mediaFormData.append('title', `${announcement.title} - Média ${i + 1}`);
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
                if (i === 0 && !isVideo(mediaUrl)) {
                  // Première image comme featured image
                  featuredMediaId = mediaData.id;
                } else {
                  // Autres médias à insérer dans le contenu
                  additionalMediaIds.push(mediaData.id);
                }
              }
            } else {
              console.error(`Media upload failed for ${fileName}`);
            }
          }
          
          updatePublishingStep("media", "success", "Médias traités", 60);
          
        } catch (error) {
          console.error("Error processing media:", error);
          updatePublishingStep("media", "error", "Erreur lors du traitement des médias");
          toast.warning("Erreur lors du traitement des médias");
        }
      } else if (isUpdate) {
        updatePublishingStep("media", "success", "Médias supprimés", 60);
        featuredMediaId = 0;
      } else {
        updatePublishingStep("media", "success", "Aucun média à traiter", 60);
      }
      
      // WordPress publication
      updatePublishingStep("wordpress", "loading", `${actionText} sur WordPress`, 70);
      
      // Determine endpoints
      let useCustomTaxonomy = false;
      let postEndpoint = `${siteUrl}/wp-json/wp/v2/pages`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
          method: 'HEAD',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        }).catch(() => ({ status: 404 }));
        
        clearTimeout(timeoutId);
        
        if (response && response.status !== 404) {
          useCustomTaxonomy = true;
          
          const dipiController = new AbortController();
          const dipiTimeoutId = setTimeout(() => dipiController.abort(), 5000);
          
          const dipiResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
            method: 'HEAD',
            headers: { 'Content-Type': 'application/json' },
            signal: dipiController.signal
          }).catch(() => ({ status: 404 }));
          
          clearTimeout(dipiTimeoutId);
          
          if (dipiResponse && dipiResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          } else {
            const altController = new AbortController();
            const altTimeoutId = setTimeout(() => altController.abort(), 5000);
            
            const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
              method: 'HEAD',
              headers: { 'Content-Type': 'application/json' },
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
      }
      
      console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
      
      if (isUpdate) {
        postEndpoint = `${postEndpoint}/${announcement.wordpress_post_id}`;
      }
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
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
      
      // Préparer le contenu avec les médias additionnels
      let contentWithMedia = announcement.description || "";
      
      // Ajouter les médias à la fin du contenu
      if (additionalMediaIds.length > 0) {
        contentWithMedia += "\n\n";
        for (const mediaId of additionalMediaIds) {
          // Récupérer les détails du média pour déterminer son type
          try {
            const mediaResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media/${mediaId}`, {
              headers: headers
            });
            
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              const mediaType = mediaData.mime_type;
              
              if (mediaType.startsWith('video/')) {
                contentWithMedia += `[video src="${mediaData.source_url}"]\n\n`;
              } else {
                contentWithMedia += `<img src="${mediaData.source_url}" alt="${mediaData.alt_text || ''}" />\n\n`;
              }
            }
          } catch (error) {
            console.error("Error fetching media details:", error);
          }
        }
      }
      
      // Prepare post data
      const wpPostData: any = {
        title: announcement.title,
        content: contentWithMedia,
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
      };
      
      // Set featured image
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
        
        let wordpressUrl;
        if (announcement.seo_slug) {
          wordpressUrl = `${siteUrl}/${announcement.seo_slug}`;
        } else {
          wordpressUrl = `${siteUrl}/?p=${wordpressPostId}`;
        }
        
        const updateData: any = {
          is_divipixel: useCustomTaxonomy,
          wordpress_url: wordpressUrl
        };
        
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
          toast.error("L'annonce a été publiée sur WordPress mais les données n'ont pas pu être enregistrées");
        } else {
          updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
        }
        
        const mediaCount = (announcement.images?.length || 0);
        const mediaText = mediaCount > 0 ? ` avec ${mediaCount} média${mediaCount > 1 ? 's' : ''}` : "";
        
        return { 
          success: true, 
          message: `${actionText} avec succès sur WordPress${mediaText}`, 
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
