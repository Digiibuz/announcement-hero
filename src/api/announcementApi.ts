
// API calls for announcements
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string, userId: string): Promise<void> => {
  try {
    // Get the announcement to check if it has a WordPress post ID
    const { data: announcement, error: fetchError } = await supabase
      .from("announcements")
      .select("wordpress_post_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      // Suppression du log d'erreur dans la console
      throw new Error('Failed to fetch announcement');
    }

    // Si l'annonce a un ID WordPress, on essaie de la supprimer de WordPress
    if (announcement && announcement.wordpress_post_id) {
      try {
        // Get WordPress config from the user's profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('wordpress_config_id')
          .eq('id', userId)
          .single();

        if (profileError) {
          // Suppression du log d'erreur dans la console
          throw new Error("Profil utilisateur non trouvé");
        }

        if (!userProfile?.wordpress_config_id) {
          // Suppression du log d'erreur dans la console
          throw new Error("Configuration WordPress introuvable");
        }
        
        // Get WordPress config
        const { data: wpConfig, error: wpConfigError } = await supabase
          .from('wordpress_configs')
          .select('site_url, app_username, app_password')
          .eq('id', userProfile.wordpress_config_id)
          .single();

        if (wpConfigError) {
          // Suppression du log d'erreur dans la console
          throw wpConfigError;
        }
        
        if (!wpConfig) {
          // Suppression du log d'erreur dans la console
          throw new Error("WordPress configuration not found");
        }

        // Ensure site_url has proper format
        const siteUrl = wpConfig.site_url.endsWith('/')
          ? wpConfig.site_url.slice(0, -1)
          : wpConfig.site_url;
        
        // Try to detect which endpoint to use
        let apiEndpoint = 'dipi_cpt';
        
        // Check if dipi_cpt endpoint exists
        const checkEndpoint = async (endpoint: string): Promise<boolean> => {
          try {
            const response = await fetch(`${siteUrl}/wp-json/wp/v2/${endpoint}/1`, {
              method: 'HEAD',
            });
            
            // Store status in variable to allow comparison
            const status = response.status;
            // 401 signifie que l'endpoint existe mais qu'une authentification est nécessaire
            return status === 401 || (status !== 404);
          } catch (error) {
            return false;
          }
        };
        
        const dipiEndpointExists = await checkEndpoint('dipi_cpt');
        
        if (!dipiEndpointExists) {
          // Suppression du log de débogage
          apiEndpoint = 'pages';
        }
        
        // Construct the WordPress API URL
        const apiUrl = `${siteUrl}/wp-json/wp/v2/${apiEndpoint}/${announcement.wordpress_post_id}`;
        // Suppression du log de débogage
        
        // Prepare headers with authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Check for authentication credentials
        if (wpConfig.app_username && wpConfig.app_password) {
          // Application Password Format: "Basic base64(username:password)"
          const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
          // Suppression du log de débogage
        } else {
          throw new Error("Aucune méthode d'authentification disponible pour WordPress");
        }
        
        // Suppression du log de débogage
        
        // Send DELETE request to WordPress
        try {
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: headers
          });

          // Suppression du log de débogage
          
          // Suppression de la réponse texte
          
          if (!response.ok) {
            // Suppression du log d'erreur dans la console
            toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + response.statusText);
          } else {
            // Suppression du log de débogage
          }
        } catch (fetchError: any) {
          // Suppression des logs d'erreur dans la console
          throw fetchError;
        }
      } catch (error: any) {
        // Suppression des logs d'erreur dans la console
        toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + error.message);
      }
    } else {
      // Suppression du log de débogage
    }

    // Delete the announcement from Supabase
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error('Failed to delete announcement');
    }
  } catch (error: any) {
    // Réafficher le toast d'erreur mais sans message détaillé
    toast.error("Erreur lors de la suppression de l'annonce");
    throw error;
  }
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/announcements/${id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'published',  // Directement publié sans étapes intermédiaires
        skip_draft: true      // Flag pour indiquer de sauter l'étape brouillon
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to publish announcement');
    }
  } catch (error: any) {
    // Suppression du log d'erreur
    throw new Error('Erreur lors de la publication de l\'annonce');
  }
};
