
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
      
      // First check if dipi_cpt_category exists to determine if we're using a DipiPixel site
      console.log("Checking if dipi_cpt_category exists...");
      const categoryEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      let useCustomTaxonomy = false;
      let postEndpoint = `${siteUrl}/wp-json/wp/v2/pages`; // Default to pages
      
      try {
        // First try to access the dipi_cpt_category endpoint
        const response = await fetch(categoryEndpoint, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Category endpoint check (${categoryEndpoint}) status:`, response.status);
        
        // If dipi_cpt_category exists, we likely should use dipi_cpt for posts
        if (response.status !== 404) {
          console.log("DipiPixel category endpoint found, trying dipi_cpt endpoint");
          useCustomTaxonomy = true;
          
          // Now check if dipi_cpt endpoint exists
          const dipiPostEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          const postEndpointResponse = await fetch(dipiPostEndpoint, {
            method: 'HEAD',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Post endpoint check (${dipiPostEndpoint}) status:`, postEndpointResponse.status);
          
          if (postEndpointResponse.status !== 404) {
            postEndpoint = dipiPostEndpoint;
            console.log("Using DipiPixel post endpoint:", postEndpoint);
          } else {
            // Try another common CPT endpoint pattern
            const altPostEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            const altResponse = await fetch(altPostEndpoint, {
              method: 'HEAD',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`Alternative post endpoint check (${altPostEndpoint}) status:`, altResponse.status);
            
            if (altResponse.status !== 404) {
              postEndpoint = altPostEndpoint;
              console.log("Using alternative DipiPixel post endpoint:", postEndpoint);
            } else {
              console.log("No DipiPixel post endpoint found, falling back to pages");
            }
          }
        } else {
          console.log("DipiPixel category endpoint not found, using standard pages");
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
        console.log("Using Application Password authentication");
      } else {
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Prepare post data
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
      } else {
        // Pour les pages standard, pas besoin d'ajouter de catégorie
        // Si nécessaire, vous pouvez ajouter des tags ou d'autres taxonomies ici
      }
      
      // Add SEO metadata if available
      if (announcement.seo_title || announcement.seo_description) {
        wpPostData.meta = {
          _yoast_wpseo_title: announcement.seo_title || "",
          _yoast_wpseo_metadesc: announcement.seo_description || "",
          _yoast_wpseo_focuskw: announcement.title
        };
      }
      
      console.log("WordPress post data:", wpPostData);

      // Send request to WordPress
      console.log("Sending POST request to WordPress:", postEndpoint);
      const response = await fetch(postEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      const responseStatus = response.status;
      console.log("WordPress API response status:", responseStatus);
      
      if (!response.ok) {
        let errorText;
        try {
          // Essayer de lire le corps de la réponse comme JSON
          const errorData = await response.json();
          console.error("WordPress API error (JSON):", errorData);
          errorText = JSON.stringify(errorData);
        } catch (jsonError) {
          // Si ce n'est pas du JSON, lire comme texte
          errorText = await response.text();
          console.error("WordPress API error (text):", errorText);
        }
        
        return { 
          success: false, 
          message: `Erreur lors de la publication WordPress (${responseStatus}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      // Log the raw response for debugging
      const rawResponse = await response.text();
      console.log("Raw WordPress response:", rawResponse);
      
      // Parse JSON response
      let wpResponseData;
      try {
        // Re-parse the text content to JSON
        wpResponseData = JSON.parse(rawResponse);
        console.log("WordPress response parsed data:", wpResponseData);
      } catch (jsonError) {
        console.error("Error parsing WordPress response:", jsonError);
        return {
          success: false,
          message: "Erreur lors de l'analyse de la réponse WordPress",
          wordpressPostId: null
        };
      }
      
      // Check if the response contains the WordPress post ID
      if (wpResponseData && typeof wpResponseData.id === 'number') {
        console.log("WordPress post ID received:", wpResponseData.id);
        
        // Now, if we have images, upload the first one as featured image
        if (announcement.images && announcement.images.length > 0) {
          const featuredImageUrl = announcement.images[0];
          console.log("Uploading featured image from URL:", featuredImageUrl);
          
          try {
            // 1. Download the image from the URL
            const imageResponse = await fetch(featuredImageUrl);
            if (!imageResponse.ok) {
              console.error("Failed to fetch image from URL:", featuredImageUrl);
              throw new Error("Failed to fetch image");
            }
            
            const imageBlob = await imageResponse.blob();
            const fileName = featuredImageUrl.split('/').pop() || 'image.jpg';
            const imageFile = new File([imageBlob], fileName, { 
              type: imageBlob.type || 'image/jpeg' 
            });
            
            // 2. Upload to WordPress Media Library
            console.log("Uploading image to WordPress media library");
            const mediaFormData = new FormData();
            mediaFormData.append('file', imageFile);
            
            const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
            const mediaResponse = await fetch(mediaEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': headers.Authorization
              },
              body: mediaFormData
            });
            
            if (!mediaResponse.ok) {
              const mediaError = await mediaResponse.text();
              console.error("Media upload error:", mediaError);
              throw new Error(`Failed to upload media: ${mediaError}`);
            }
            
            const mediaData = await mediaResponse.json();
            console.log("Media upload response:", mediaData);
            
            if (mediaData && mediaData.id) {
              // 3. Set as featured image for the post
              console.log("Setting featured image for post", wpResponseData.id, "with media ID", mediaData.id);
              
              const updatePostEndpoint = `${postEndpoint}/${wpResponseData.id}`;
              const updateResponse = await fetch(updatePostEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  featured_media: mediaData.id
                })
              });
              
              if (!updateResponse.ok) {
                const updateError = await updateResponse.text();
                console.error("Error setting featured image:", updateError);
                // We'll continue even if featured image setting fails
              } else {
                console.log("Featured image set successfully");
              }
            }
          } catch (imageError: any) {
            console.error("Error processing image:", imageError);
            // We'll continue even if image upload fails
          }
        }
        
        // Update the announcement in Supabase with the WordPress post ID
        const { error: updateError } = await supabase
          .from("announcements")
          .update({ 
            wordpress_post_id: wpResponseData.id,
            is_divipixel: useCustomTaxonomy 
          })
          .eq("id", announcement.id);
          
        if (updateError) {
          console.error("Error updating announcement with WordPress post ID:", updateError);
          toast.error("L'annonce a été publiée sur WordPress mais l'ID n'a pas pu être enregistré dans la base de données");
        } else {
          console.log("Successfully updated announcement with WordPress post ID:", wpResponseData.id);
        }
        
        return { 
          success: true, 
          message: "Publié avec succès sur WordPress", 
          wordpressPostId: wpResponseData.id 
        };
      } else {
        console.error("WordPress response does not contain post ID or ID is not a number", wpResponseData);
        return { 
          success: false, 
          message: "La réponse WordPress ne contient pas l'ID du post ou l'ID n'est pas un nombre", 
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
