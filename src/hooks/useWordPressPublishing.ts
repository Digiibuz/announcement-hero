import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

interface PublishToWordPressResult {
  success: boolean;
  message: string;
  wordpressPostId?: number;
}

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);

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
      
      // Prepare post data with Yoast SEO meta fields format
      const postData: any = {
        title: announcement.title,
        content: content,
        status: status,
        categories: [parseInt(wpCategoryId)],
        date: announcement.status === 'scheduled' ? announcement.publish_date : undefined,
        // Format for Yoast SEO meta fields - using correct keys that Yoast recognizes
        meta: {
          _yoast_wpseo_title: announcement.seo_title || announcement.title,
          _yoast_wpseo_metadesc: announcement.seo_description || "",
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
        seoTitle: postData.meta._yoast_wpseo_title,
        seoDescription: postData.meta._yoast_wpseo_metadesc,
        wpseoMetadesc: postData.meta.wpseo_metadesc,
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

  return {
    publishToWordPress,
    isPublishing
  };
};
