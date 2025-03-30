
// API calls for announcements
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string, userId: string): Promise<{ success: boolean; message: string }> => {
  // Get the announcement to check if it has a WordPress post ID
  const { data: announcement, error: fetchError } = await supabase
    .from("announcements")
    .select("wordpress_post_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching announcement:", fetchError);
    return { 
      success: false, 
      message: 'Impossible de récupérer les informations de l\'annonce'
    };
  }

  console.log("Announcement data:", announcement);
  console.log("WordPress post ID:", announcement?.wordpress_post_id);

  // Si l'annonce a un ID WordPress, nous devons d'abord la supprimer de WordPress
  let wordpressDeleteSuccess = true;
  
  if (announcement && announcement.wordpress_post_id) {
    try {
      // Get WordPress config from the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return {
          success: false,
          message: "Profil utilisateur non trouvé"
        };
      }

      console.log("User profile:", userProfile);

      if (!userProfile?.wordpress_config_id) {
        console.error("WordPress configuration not found for user");
        return {
          success: false,
          message: "Configuration WordPress introuvable"
        };
      }
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', userProfile.wordpress_config_id)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        return {
          success: false,
          message: "Impossible de récupérer la configuration WordPress"
        };
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        return {
          success: false,
          message: "Configuration WordPress introuvable"
        };
      }

      console.log("WordPress config:", {
        site_url: wpConfig.site_url,
        hasAppUsername: !!wpConfig.app_username,
        hasAppPassword: !!wpConfig.app_password
      });

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Construct the WordPress API URL for posts
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts/${announcement.wordpress_post_id}`;
      console.log("WordPress deletion URL:", apiUrl);
      
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
        console.log("Auth header format (not showing actual credentials):", "Basic ****");
      } else {
        return {
          success: false,
          message: "Aucune méthode d'authentification disponible pour WordPress"
        };
      }
      
      console.log("Sending WordPress deletion request...");
      
      // Send DELETE request to WordPress
      try {
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: headers
        });

        console.log("WordPress deletion response status:", response.status);
        
        const responseText = await response.text();
        console.log("WordPress deletion response:", responseText);
        
        if (!response.ok) {
          console.error("WordPress deletion error:", responseText);
          return {
            success: false,
            message: `L'annonce n'a pas pu être supprimée de WordPress: ${response.statusText}`
          };
        } else {
          console.log("WordPress post deleted successfully");
          // Succès de la suppression WordPress
          wordpressDeleteSuccess = true;
        }
      } catch (fetchError: any) {
        console.error("Fetch error during WordPress deletion:", fetchError);
        console.error("Fetch error message:", fetchError.message);
        console.error("Fetch error stack:", fetchError.stack);
        return {
          success: false,
          message: `Erreur lors de la suppression sur WordPress: ${fetchError.message}`
        };
      }
    } catch (error: any) {
      console.error("Error deleting from WordPress:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return {
        success: false,
        message: `Erreur lors de la suppression sur WordPress: ${error.message}`
      };
    }
  } else {
    console.log("No WordPress post ID associated with this announcement, skipping WordPress deletion");
  }

  // Si nous avons un ID WordPress et que la suppression WordPress a échoué, ne pas supprimer l'annonce de Supabase
  if (announcement?.wordpress_post_id && !wordpressDeleteSuccess) {
    return {
      success: false,
      message: "L'annonce n'a pas été supprimée de WordPress. La suppression a été annulée."
    };
  }

  // Delete the announcement from Supabase
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: `Impossible de supprimer l'annonce de la base de données: ${error.message}`
    };
  }

  return {
    success: true,
    message: announcement?.wordpress_post_id 
      ? "L'annonce a été supprimée avec succès de l'application et de WordPress"
      : "L'annonce a été supprimée avec succès"
  };
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (id: string): Promise<void> => {
  const response = await fetch(`/api/announcements/${id}/publish`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to publish announcement');
  }
};
