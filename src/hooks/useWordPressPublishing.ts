
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
      let customEndpointExists = false;
      let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`; // Changed from pages to posts as default
      
      try {
        // Vérifier d'abord si la taxonomie personnalisée existe
        console.log("Checking if dipi_cpt_category endpoint exists...");
        const taxonomyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.log("Error checking taxonomy endpoint:", err);
          return { status: 404 };
        });
        
        if (taxonomyResponse && taxonomyResponse.status !== 404) {
          console.log("DipiPixel taxonomy endpoint found!");
          useCustomTaxonomy = true;
          
          // Now check if dipi_cpt endpoint exists
          console.log("Checking if dipi_cpt endpoint exists...");
          const customPostTypeResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
            method: 'HEAD',
            headers: {
              'Content-Type': 'application/json'
            }
          }).catch(err => {
            console.log("Error checking custom post type endpoint:", err);
            return { status: 404 };
          });
          
          if (customPostTypeResponse && customPostTypeResponse.status !== 404) {
            console.log("DipiPixel custom post type endpoint found!");
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
            customEndpointExists = true;
          } else {
            // If dipi_cpt doesn't exist, try dipicpt as alternative
            console.log("Checking if dipicpt endpoint exists...");
            const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
              method: 'HEAD',
              headers: {
                'Content-Type': 'application/json'
              }
            }).catch(err => {
              console.log("Error checking alternative endpoint:", err);
              return { status: 404 };
            });
            
            if (altResponse && altResponse.status !== 404) {
              console.log("Alternative dipicpt endpoint found!");
              postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
              customEndpointExists = true;
            } else {
              console.log("No custom post type endpoint found, falling back to posts");
            }
          }
        } else {
          console.log("No custom taxonomy endpoint found, using standard categories");
        }
      } catch (error) {
        console.log("Error checking endpoints:", error);
        console.log("Falling back to standard posts endpoint");
      }
      
      console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Vérifier quelles méthodes d'authentification sont disponibles
      if (wpConfig.app_username && wpConfig.app_password) {
        // Base64 encode the credentials manually to ensure proper format
        const credentials = `${wpConfig.app_username}:${wpConfig.app_password}`;
        const base64Credentials = btoa(credentials);
        headers['Authorization'] = `Basic ${base64Credentials}`;
        console.log("Using Application Password authentication");
        console.log("Using credentials for:", wpConfig.app_username);
      } else if (wpConfig.rest_api_key) {
        // API Key Format: "Bearer API_KEY"
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
        console.log("Using REST API Key authentication");
      } else if (wpConfig.username && wpConfig.password) {
        // Legacy username/password auth
        const credentials = `${wpConfig.username}:${wpConfig.password}`;
        const base64Credentials = btoa(credentials);
        headers['Authorization'] = `Basic ${base64Credentials}`;
        console.log("Using Legacy Basic authentication");
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
            mediaFormData.append('title', announcement.title);
            mediaFormData.append('alt_text', announcement.title);
            
            const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
            console.log("Media endpoint:", mediaEndpoint);
            
            // Créer des en-têtes pour le téléversement des médias sans Content-Type
            const mediaHeaders = new Headers();
            if (headers.Authorization) {
              mediaHeaders.append('Authorization', headers.Authorization);
              console.log("Added authorization header to media request");
            }
            
            const mediaResponse = await fetch(mediaEndpoint, {
              method: 'POST',
              headers: mediaHeaders,
              body: mediaFormData
            });
            
            if (!mediaResponse.ok) {
              const mediaErrorText = await mediaResponse.text();
              console.error("Erreur lors du téléversement du média:", mediaResponse.status, mediaErrorText);
              updatePublishingStep("image", "error", `Échec du téléversement de l'image (${mediaResponse.status})`);
              toast.warning("L'image principale n'a pas pu être téléversée, publication sans image");
            } else {
              const mediaData = await mediaResponse.json();
              
              if (mediaData && mediaData.id) {
                featuredMediaId = mediaData.id;
                console.log("Image téléversée avec succès, ID:", featuredMediaId);
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
      
      // Préparer les données du post selon le type d'endpoint
      const wpPostData: any = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
      };
      
      // Ajouter l'image mise en avant si disponible
      if (featuredMediaId) {
        wpPostData.featured_media = featuredMediaId;
      }
      
      // Ajouter la date pour les publications planifiées
      if (announcement.status === 'scheduled' && announcement.publish_date) {
        wpPostData.date = new Date(announcement.publish_date).toISOString();
      }
      
      // Ajouter la catégorie selon le type d'endpoint
      if (useCustomTaxonomy && customEndpointExists) {
        // Utiliser la taxonomie personnalisée DipiPixel
        wpPostData.dipi_cpt_category = [parseInt(wordpressCategoryId)];
        console.log("Using custom taxonomy with category ID:", wordpressCategoryId);
      } else {
        // Utiliser la catégorie standard WordPress
        wpPostData.categories = [parseInt(wordpressCategoryId)];
        console.log("Using standard WordPress categories with ID:", wordpressCategoryId);
      }
      
      // Ajouter les méta-données SEO si disponibles
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
        };
      }
      
      // Créer le post avec l'image (si disponible)
      console.log("Sending POST request to WordPress:", postEndpoint);
      console.log("Post data:", JSON.stringify(wpPostData, null, 2));
      
      const postResponse = await fetch(postEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      if (!postResponse.ok) {
        let errorText = await postResponse.text();
        console.error("WordPress API error:", postResponse.status, errorText);
        
        if (postResponse.status === 401 || postResponse.status === 403) {
          // Problème d'authentification - essayons une autre méthode
          console.log("Authentication error, trying alternative auth method...");
          
          // Essayer directement l'authentification HTTP par cookie (fallback)
          try {
            const loginEndpoint = `${siteUrl}/wp-login.php`;
            const loginFormData = new FormData();
            
            if (wpConfig.username && wpConfig.password) {
              loginFormData.append('log', wpConfig.username);
              loginFormData.append('pwd', wpConfig.password);
              loginFormData.append('wp-submit', 'Log In');
              
              const loginResponse = await fetch(loginEndpoint, {
                method: 'POST',
                body: loginFormData,
                credentials: 'include'
              });
              
              if (loginResponse.ok) {
                console.log("Direct login successful, retrying post creation...");
                
                // Retry the post creation with cookies
                const retryResponse = await fetch(postEndpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(wpPostData),
                  credentials: 'include'
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  updatePublishingStep("wordpress", "success", "Publication WordPress réussie (méthode alternative)", 85);
                  
                  // Update the database with WordPress post ID
                  if (retryData && typeof retryData.id === 'number') {
                    const { error: updateError } = await supabase
                      .from("announcements")
                      .update({ 
                        wordpress_post_id: retryData.id,
                        is_divipixel: useCustomTaxonomy && customEndpointExists
                      })
                      .eq("id", announcement.id);
                      
                    if (updateError) {
                      console.error("Error updating announcement with WordPress post ID:", updateError);
                      updatePublishingStep("database", "error", "Erreur de mise à jour de la base de données");
                    } else {
                      updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
                    }
                    
                    return { 
                      success: true, 
                      message: "Publié avec succès sur WordPress (méthode alternative)" + (featuredMediaId ? " avec image principale" : ""), 
                      wordpressPostId: retryData.id 
                    };
                  }
                } else {
                  console.error("Retry failed:", await retryResponse.text());
                }
              } else {
                console.error("Direct login failed");
              }
            }
          } catch (loginError) {
            console.error("Error during alternative auth attempt:", loginError);
          }
          
          updatePublishingStep("wordpress", "error", `Erreur d'authentification (${postResponse.status})`);
          return { 
            success: false, 
            message: `Erreur d'authentification WordPress (${postResponse.status}). Veuillez vérifier vos identifiants.`, 
            wordpressPostId: null 
          };
        } else {
          updatePublishingStep("wordpress", "error", `Erreur de publication (${postResponse.status})`);
          return { 
            success: false, 
            message: `Erreur lors de la publication WordPress (${postResponse.status}): ${errorText}`, 
            wordpressPostId: null 
          };
        }
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
