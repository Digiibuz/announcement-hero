
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

  // Fonction pour optimiser le contenu pour WordPress
  const optimizeContentForWordPress = (content: string): string => {
    if (!content) return content;

    // Convertir les liens YouTube en shortcodes WordPress si nécessaire
    // WordPress gère automatiquement la conversion des liens YouTube via oEmbed
    let optimizedContent = content;

    // Nettoyer les styles inline des images pour la compatibilité WordPress
    optimizedContent = optimizedContent.replace(
      /<img([^>]*?)style="[^"]*"([^>]*?)>/gi,
      '<img$1$2>'
    );

    // Ajouter des classes WordPress pour les images si elles n'en ont pas
    optimizedContent = optimizedContent.replace(
      /<img(?![^>]*class=)([^>]*?)>/gi,
      '<img class="wp-image aligncenter size-full"$1>'
    );

    return optimizedContent;
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
      
      // Define siteUrl here for use throughout the function
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 25);
      
      // NOUVELLE ÉTAPE: Compression légère pour la publication (les images sont déjà en WebP)
      let featuredMediaId = null;
      
      if (announcement.images && announcement.images.length > 0) {
        try {
          updatePublishingStep("compress", "loading", "Compression légère pour WordPress", 40);
          
          // Compression légère WebP vers JPEG pour WordPress
          const compressedImageUrl = await compressImage(announcement.images[0], {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.9,
            format: 'jpeg' // WordPress préfère JPEG pour la compatibilité
          });
          
          updatePublishingStep("compress", "success", "Image compressée", 50);
          
          // Convert blob URL to file for WordPress upload
          const response = await fetch(compressedImageUrl);
          const blob = await response.blob();
          const imageFile = new File([blob], `${announcement.title}-compressed.jpg`, { 
            type: 'image/jpeg' 
          });
          
          // Upload to WordPress media library
          console.log("Uploading compressed image to WordPress");
          const mediaFormData = new FormData();
          mediaFormData.append('file', imageFile);
          mediaFormData.append('title', `${announcement.title} - ${Date.now()}`);
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
              updatePublishingStep("compress", "success", "Image téléversée", 60);
            }
          } else {
            console.error("Media upload failed");
            updatePublishingStep("compress", "error", "Échec du téléversement de l'image");
          }
          
          // Clean up blob URL
          URL.revokeObjectURL(compressedImageUrl);
          
        } catch (error) {
          console.error("Error compressing image:", error);
          updatePublishingStep("compress", "error", "Erreur lors de la compression");
          toast.warning("Erreur lors du traitement de l'image");
        }
      } else if (isUpdate) {
        updatePublishingStep("compress", "success", "Image supprimée", 60);
        featuredMediaId = 0;
      } else {
        updatePublishingStep("compress", "success", "Aucune image à traiter", 60);
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
      
      // Check for authentication credentials
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
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
      
      // Optimize content for WordPress
      const optimizedDescription = optimizeContentForWordPress(announcement.description || "");
      
      // Prepare post data
      const wpPostData: any = {
        title: announcement.title,
        content: optimizedDescription,
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
        // Use the custom taxonomy for DipiPixel
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
          toast.error("L'annonce a été publiée sur WordPress mais les données n'ont pas pu être enregistrées");
        } else {
          updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
        }
        
        return { 
          success: true, 
          message: `${actionText} avec succès sur WordPress` + (featuredMediaId ? " avec image optimisée" : ""), 
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
