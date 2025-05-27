import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";

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
    image: { status: "idle" },
    wordpress: { status: "idle" },
    database: { status: "idle" }
  },
  progress: 0
};

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingState, setPublishingState] = useState<PublishingState>(initialPublishingState);
  
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
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();
    
    // Start with preparation step
    updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
    
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
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 25);
      
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
        updatePublishingStep("prepare", "error", "Aucune méthode d'authentification disponible");
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // AMÉLIORATION: Traitement de l'image principale avant la création du post
      let featuredMediaId = null;
      
      // Si des images sont disponibles, traiter l'image principale d'abord
      if (announcement.images && announcement.images.length > 0) {
        try {
          updatePublishingStep("image", "loading", "Téléversement de l'image principale", 40);
          
          // 1. Télécharger l'image depuis l'URL
          const imageUrl = announcement.images[0];
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error("Échec de la récupération de l'image depuis l'URL:", imageUrl);
            updatePublishingStep("image", "error", "Échec de récupération de l'image");
            toast.warning("L'image principale n'a pas pu être préparée, publication sans image");
          } else {
            const imageBlob = await imageResponse.blob();
            const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
            const imageFile = new File([imageBlob], fileName, { 
              type: imageBlob.type || 'image/jpeg' 
            });
            
            // 2. Téléverser vers la bibliothèque média WordPress
            console.log("Téléversement de l'image vers la bibliothèque média WordPress");
            const mediaFormData = new FormData();
            mediaFormData.append('file', imageFile);
            // Solution 1: Préfixer le titre de l'image pour éviter les conflits de slug
            mediaFormData.append('title', `Photo - ${announcement.title}`);
            mediaFormData.append('alt_text', announcement.title);
            
            const mediaEndpoint = `${postEndpoint.split('/wp-json/')[0]}/wp-json/wp/v2/media`;
            
            // Créer des en-têtes pour le téléversement des médias sans Content-Type
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
              console.error("Erreur lors du téléversement du média:", mediaErrorText);
              updatePublishingStep("image", "error", "Échec du téléversement de l'image");
              toast.warning("L'image principale n'a pas pu être téléversée, publication sans image");
            } else {
              const mediaData = await mediaResponse.json();
              
              if (mediaData && mediaData.id) {
                featuredMediaId = mediaData.id;
                updatePublishingStep("image", "success", "Image téléversée avec succès", 60);
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors du traitement de l'image principale:", error);
          updatePublishingStep("image", "error", "Erreur lors du traitement de l'image");
          toast.warning("Erreur lors du traitement de l'image principale, publication sans image");
        }
      } else {
        updatePublishingStep("image", "success", "Aucune image à téléverser", 60);
      }
      
      // Update WordPress step status
      updatePublishingStep("wordpress", "loading", "Publication sur WordPress", 70);
      
      // Prepare post data - toujours utiliser "publish" pour publier immédiatement
      const wpPostData: any = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish', // Passer directement à "publish" sans étape draft/ready
      };
      
      // Set featured image if available
      if (featuredMediaId) {
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
      
      // Add SEO metadata if available - simplified
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
        };
      }
      
      // Create post with image (if available)
      console.log("Sending POST request to WordPress:", postEndpoint);
      const postResponse = await fetch(postEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      if (!postResponse.ok) {
        let errorText = await postResponse.text();
        console.error("WordPress API error:", errorText);
        updatePublishingStep("wordpress", "error", "Erreur lors de la publication");
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
        updatePublishingStep("wordpress", "success", "Publication WordPress réussie", 85);
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
          updatePublishingStep("database", "error", "Erreur de mise à jour de la base de données");
          toast.error("L'annonce a été publiée sur WordPress mais l'ID n'a pas pu être enregistré dans la base de données");
        } else {
          updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
        }
        
        return { 
          success: true, 
          message: "Publié avec succès sur WordPress" + (featuredMediaId ? " avec image principale" : ""), 
          wordpressPostId 
        };
      } else {
        console.error("WordPress response does not contain post ID or ID is not a number", wpResponseData);
        updatePublishingStep("database", "error", "Données incomplètes");
        return { 
          success: false, 
          message: "La réponse WordPress ne contient pas l'ID du post", 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      // Update the current step with error status
      if (publishingState.currentStep) {
        updatePublishingStep(publishingState.currentStep, "error", `Erreur: ${error.message}`);
      }
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
    isPublishing,
    publishingState,
    resetPublishingState
  };
};
