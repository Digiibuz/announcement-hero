import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";
import { prepareWordPressAuthHeaders, tryJwtAuthentication, tryFormAuthentication } from "./wordpress/useWordPressAuth";
import { detectWordPressEndpoints } from "./wordpress/useWordPressEndpoints";
import { uploadFeatureImage } from "./wordpress/useWordPressMedia";

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

export type PublishingStep = "idle" | "loading" | "success" | "error";

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
    
    // Start preparation step
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
      
      // Format site URL
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Detect WordPress API endpoints
      const { postEndpoint, useCustomTaxonomy, customEndpointExists } = 
        await detectWordPressEndpoints(siteUrl);
      
      // Prepare authentication headers
      const { headers, authenticationSuccess } = prepareWordPressAuthHeaders(wpConfig);
      
      if (!authenticationSuccess) {
        updatePublishingStep("prepare", "error", "Aucune méthode d'authentification disponible");
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Upload featured image if available
      const featuredMediaId = await uploadFeatureImage(
        announcement, 
        siteUrl, 
        headers, 
        updatePublishingStep
      );
      
      // Start WordPress publishing step
      updatePublishingStep("wordpress", "loading", "Publication sur WordPress", 70);
      
      // Prepare post data
      const wpPostData: any = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
      };
      
      // Add featured image if available
      if (featuredMediaId) {
        wpPostData.featured_media = featuredMediaId;
      }
      
      // Add scheduled date if needed
      if (announcement.status === 'scheduled' && announcement.publish_date) {
        wpPostData.date = new Date(announcement.publish_date).toISOString();
      }
      
      // Add categories based on endpoint type
      if (useCustomTaxonomy && customEndpointExists) {
        wpPostData.dipi_cpt_category = [parseInt(wordpressCategoryId)];
        console.log("Using custom taxonomy with category ID:", wordpressCategoryId);
      } else {
        wpPostData.categories = [parseInt(wordpressCategoryId)];
        console.log("Using standard WordPress categories with ID:", wordpressCategoryId);
      }
      
      // Add SEO metadata if available
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
        };
      }
      
      console.log("Post data:", JSON.stringify(wpPostData, null, 2));
      console.log("Sending POST request to WordPress:", postEndpoint);
      
      // Cache credentials for alternative auth methods
      const credentials = {
        username: wpConfig.app_username || wpConfig.username || '',
        password: wpConfig.app_password || wpConfig.password || '',
        hasAppAuth: !!(wpConfig.app_username && wpConfig.app_password),
        hasBasicAuth: !!(wpConfig.username && wpConfig.password)
      };
      
      try {
        // Initial attempt with configured authentication
        const postResponse = await fetch(postEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(wpPostData)
        });
        
        // Handle authentication errors
        if (postResponse.status === 401 || postResponse.status === 403) {
          console.log("Authentication error, trying alternative auth methods...");
          
          let altAuthResult = null;
          
          // Try JWT authentication
          if (credentials.username && credentials.password) {
            altAuthResult = await tryJwtAuthentication(
              siteUrl,
              credentials,
              wpPostData
            );
            
            if (altAuthResult.success) {
              // Success with JWT auth
              updatePublishingStep("wordpress", "success", "Publication WordPress réussie via JWT", 85);
              
              // Update database
              return await finishPublication(
                announcement,
                useCustomTaxonomy,
                customEndpointExists,
                altAuthResult.responseData,
                featuredMediaId,
                updatePublishingStep
              );
            }
          }
          
          // Try form-based authentication
          if (!altAuthResult?.success && credentials.username && credentials.password) {
            altAuthResult = await tryFormAuthentication(
              siteUrl,
              credentials,
              wpPostData,
              postEndpoint
            );
            
            if (altAuthResult.success) {
              // Success with form auth
              updatePublishingStep("wordpress", "success", "Publication WordPress réussie via connexion formulaire", 85);
              
              // Update database
              return await finishPublication(
                announcement,
                useCustomTaxonomy,
                customEndpointExists,
                altAuthResult.responseData,
                featuredMediaId,
                updatePublishingStep
              );
            }
          }
          
          // Try direct post without authentication
          try {
            console.log("Trying direct post without authentication as last resort");
            
            const noAuthResponse = await fetch(postEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(wpPostData)
            });
            
            if (noAuthResponse.ok) {
              const responseData = await noAuthResponse.json();
              
              if (responseData && responseData.id) {
                updatePublishingStep("wordpress", "success", "Publication WordPress réussie sans authentification", 85);
                
                // Update database
                return await finishPublication(
                  announcement,
                  useCustomTaxonomy,
                  customEndpointExists,
                  responseData,
                  featuredMediaId,
                  updatePublishingStep
                );
              }
            }
          } catch (noAuthError) {
            console.error("No auth post error:", noAuthError);
          }
          
          // All alternative methods failed
          updatePublishingStep("wordpress", "error", `Échec d'authentification (${postResponse.status})`);
          return { 
            success: false, 
            message: `Erreur d'authentification WordPress (${postResponse.status}). Veuillez vérifier vos identifiants et vos permissions.`, 
            wordpressPostId: null 
          };
        } else if (!postResponse.ok) {
          // Other API errors
          const errorText = await postResponse.text();
          updatePublishingStep("wordpress", "error", `Erreur de publication (${postResponse.status})`);
          return { 
            success: false, 
            message: `Erreur lors de la publication WordPress (${postResponse.status}): ${errorText.substring(0, 100)}`, 
            wordpressPostId: null 
          };
        }
        
        // Successful response with initial auth
        const wpResponseData = await postResponse.json();
        console.log("WordPress response data:", wpResponseData);
        updatePublishingStep("wordpress", "success", "Publication WordPress réussie", 85);
        
        // Update database with WordPress post ID
        return await finishPublication(
          announcement,
          useCustomTaxonomy,
          customEndpointExists,
          wpResponseData,
          featuredMediaId,
          updatePublishingStep
        );
      } catch (error: any) {
        console.error("Error in fetch operation:", error);
        updatePublishingStep("wordpress", "error", `Erreur de communication: ${error.message}`);
        return { 
          success: false, 
          message: `Erreur de communication avec WordPress: ${error.message}`, 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      // Update current step with error status
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
  
  /**
   * Handles the final database update after successful WordPress publication
   */
  const finishPublication = async (
    announcement: Announcement,
    useCustomTaxonomy: boolean,
    customEndpointExists: boolean,
    wpResponseData: any,
    featuredMediaId: number | null,
    updatePublishingStep: (stepId: string, status: PublishingStatus, message?: string, progress?: number) => void
  ) => {
    updatePublishingStep("database", "loading", "Mise à jour de la base de données", 90);
    
    // Verify WordPress post ID
    if (wpResponseData && typeof wpResponseData.id === 'number') {
      const wordpressPostId = wpResponseData.id;
      console.log("WordPress post ID received:", wordpressPostId);
      
      // Update announcement with WordPress post ID
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ 
          wordpress_post_id: wordpressPostId,
          is_divipixel: useCustomTaxonomy && customEndpointExists
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
  };
  
  return {
    publishToWordPress,
    isPublishing,
    publishingState,
    resetPublishingState
  };
};
