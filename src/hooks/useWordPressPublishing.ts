
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

interface PublishToWordPressResult {
  success: boolean;
  message: string;
  wordpressPostId?: number;
}

interface DeleteFromWordPressResult {
  success: boolean;
  message: string;
}

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const publishToWordPress = async (
    announcement: Announcement, 
    wpCategoryId: string,
    userId: string
  ): Promise<PublishToWordPressResult> => {
    if (!userId) {
      console.error("No user ID provided");
      return { 
        success: false, 
        message: "Utilisateur non identifié" 
      };
    }

    try {
      setIsPublishing(true);
      console.log("Récupération de la configuration WordPress...");
      
      // Get WordPress config from the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Erreur lors de la récupération du profil utilisateur:", profileError);
        throw new Error("Profil utilisateur non trouvé");
      }

      if (!userProfile?.wordpress_config_id) {
        console.error("Configuration WordPress introuvable pour cet utilisateur");
        throw new Error("Configuration WordPress introuvable");
      }
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', userProfile.wordpress_config_id)
        .single();

      if (wpConfigError) {
        console.error("Erreur lors de la récupération de la configuration WordPress:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("Configuration WordPress non trouvée");
        throw new Error("WordPress configuration not found");
      }

      console.log("Configuration WordPress récupérée:", {
        site_url: wpConfig.site_url,
        hasAppCredentials: !!(wpConfig.app_username && wpConfig.app_password),
      });

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Construct the WordPress API URL for posts
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;
      console.log("URL de l'API WordPress:", apiUrl);
      
      // Format the content correctly
      const content = announcement.description || "";
      
      // Determine publication status
      let status = 'draft';
      if (announcement.status === 'published') {
        status = 'publish';
      } else if (announcement.status === 'scheduled' && announcement.publish_date) {
        status = 'future';
      }
      
      // Prepare post data with Yoast SEO meta fields based on correct API fields
      // Using the fields from the provided image: wpseo_title and wpseo_metadesc
      const postData: any = {
        title: announcement.title,
        content: content,
        status: status,
        categories: [parseInt(wpCategoryId)],
        date: announcement.status === 'scheduled' ? announcement.publish_date : undefined,
        meta: {
          // Using the filter/field names from the provided image
          wpseo_title: announcement.seo_title || announcement.title,
          wpseo_metadesc: announcement.seo_description || "",
          _yoast_wpseo_focuskw: announcement.title,
        },
        // Add slug if available
        slug: announcement.seo_slug || undefined
      };
      
      console.log("Données de la publication:", {
        title: postData.title,
        status: postData.status,
        categoryId: wpCategoryId,
        hasDate: !!postData.date,
        seoTitle: postData.meta.wpseo_title,
        seoDescription: postData.meta.wpseo_metadesc,
        slug: postData.slug
      });
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Vérifier que nous avons des identifiants d'application
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Utilisation de l'authentification par Application Password");
      } else {
        throw new Error("Aucune méthode d'authentification disponible pour WordPress. Veuillez configurer les identifiants d'Application Password.");
      }
      
      // Handle featured image (if available)
      if (announcement.images && announcement.images.length > 0) {
        // Get the first image URL as the featured image
        const featuredImageUrl = announcement.images[0];
        console.log("Image mise en avant URL:", featuredImageUrl);
        
        // First, create the media item in WordPress
        try {
          console.log("Téléchargement de l'image mise en avant vers WordPress...");
          
          // Fetch the image file from the URL
          const imageResponse = await fetch(featuredImageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          
          // Extract the filename from the URL
          const urlParts = featuredImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // Create a new FormData object and append the image
          const formData = new FormData();
          formData.append('file', imageBlob, fileName);
          
          // POST the image to WordPress media endpoint
          const mediaResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': headers['Authorization'],
              // Content-Type is set automatically by the browser with FormData
            },
            body: formData
          });
          
          if (!mediaResponse.ok) {
            const errorText = await mediaResponse.text();
            console.error("Erreur lors du téléversement de l'image:", errorText);
            throw new Error(`Failed to upload featured image: ${mediaResponse.status} ${mediaResponse.statusText}`);
          }
          
          const mediaData = await mediaResponse.json();
          console.log("Image téléversée avec succès sur WordPress, ID:", mediaData.id);
          
          // Set the featured image ID in the post data
          postData.featured_media = mediaData.id;
        } catch (mediaError: any) {
          console.error("Erreur lors de la gestion de l'image mise en avant:", mediaError);
          // Continue with post creation even if image upload fails
          console.log("Continuation de la création de l'article sans image mise en avant");
        }
      }
      
      console.log("Envoi de la requête à WordPress...");
      
      // Send request to WordPress
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(postData)
      });

      console.log("Statut de la réponse:", response.status);
      
      const responseText = await response.text();
      console.log("Réponse texte:", responseText);
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, keep as text
        responseData = responseText;
      }

      if (!response.ok) {
        console.error("Erreur de publication WordPress:", responseData);
        throw new Error(`Failed to publish to WordPress: ${response.status} ${response.statusText}`);
      }

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
      
      return { 
        success: true, 
        message: "Publication WordPress réussie",
        wordpressPostId: responseData?.id 
      };
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      return { 
        success: false, 
        message: `Erreur lors de la publication WordPress: ${error.message}` 
      };
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteFromWordPress = async (
    announcementId: string,
    wordpressPostId: number,
    userId: string
  ): Promise<DeleteFromWordPressResult> => {
    if (!userId) {
      console.error("No user ID provided");
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

    try {
      setIsDeleting(true);
      console.log("Récupération de la configuration WordPress...");
      
      // Get WordPress config from the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Erreur lors de la récupération du profil utilisateur:", profileError);
        throw new Error("Profil utilisateur non trouvé");
      }

      if (!userProfile?.wordpress_config_id) {
        console.error("Configuration WordPress introuvable pour cet utilisateur");
        throw new Error("Configuration WordPress introuvable");
      }
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', userProfile.wordpress_config_id)
        .single();

      if (wpConfigError) {
        console.error("Erreur lors de la récupération de la configuration WordPress:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("Configuration WordPress non trouvée");
        throw new Error("WordPress configuration not found");
      }

      console.log("Configuration WordPress récupérée:", {
        site_url: wpConfig.site_url,
        hasAppCredentials: !!(wpConfig.app_username && wpConfig.app_password),
      });

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Construct the WordPress API URL for posts
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts/${wordpressPostId}`;
      console.log("URL de suppression WordPress:", apiUrl);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Vérifier que nous avons des identifiants d'application
      if (wpConfig.app_username && wpConfig.app_password) {
        // Application Password Format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Utilisation de l'authentification par Application Password");
      } else {
        throw new Error("Aucune méthode d'authentification disponible pour WordPress. Veuillez configurer les identifiants d'Application Password.");
      }
      
      console.log("Envoi de la requête de suppression à WordPress...");
      
      // Send DELETE request to WordPress
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: headers
      });

      console.log("Statut de la réponse de suppression:", response.status);
      
      const responseText = await response.text();
      console.log("Réponse texte:", responseText);
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, keep as text
        responseData = responseText;
      }

      if (!response.ok) {
        console.error("Erreur de suppression WordPress:", responseData);
        throw new Error(`Failed to delete from WordPress: ${response.status} ${response.statusText}`);
      }

      console.log("Suppression WordPress réussie:", responseData);
      
      // Mettre à jour l'annonce dans Supabase pour supprimer l'ID WordPress
      await supabase
        .from('announcements')
        .update({ wordpress_post_id: null })
        .eq('id', announcementId);
      
      return { 
        success: true, 
        message: "Suppression WordPress réussie"
      };
    } catch (error: any) {
      console.error("Error deleting from WordPress:", error);
      return { 
        success: false, 
        message: `Erreur lors de la suppression WordPress: ${error.message}` 
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    publishToWordPress,
    deleteFromWordPress,
    isPublishing,
    isDeleting
  };
};
