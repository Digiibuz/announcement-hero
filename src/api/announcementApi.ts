
// API calls for announcements
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string, userId: string): Promise<void> => {
  // Get the announcement to check if it has a WordPress post ID
  const { data: announcement, error: fetchError } = await supabase
    .from("announcements")
    .select("wordpress_post_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching announcement:", fetchError);
    throw new Error('Failed to fetch announcement');
  }

  console.log("Announcement data:", announcement);
  console.log("WordPress post ID:", announcement?.wordpress_post_id);

  // If there's a WordPress post ID, delete it from WordPress
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
        throw new Error("Profil utilisateur non trouvé");
      }

      console.log("User profile:", userProfile);

      if (!userProfile?.wordpress_config_id) {
        console.error("WordPress configuration not found for user");
        throw new Error("Configuration WordPress introuvable");
      }
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', userProfile.wordpress_config_id)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        throw new Error("WordPress configuration not found");
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
        console.log("DipiPixel endpoint not found, using standard pages endpoint");
        apiEndpoint = 'pages';
      }
      
      // Construct the WordPress API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/${apiEndpoint}/${announcement.wordpress_post_id}`;
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
        throw new Error("Aucune méthode d'authentification disponible pour WordPress");
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
          toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + response.statusText);
        } else {
          console.log("WordPress post deleted successfully");
        }
      } catch (fetchError: any) {
        console.error("Fetch error during WordPress deletion:", fetchError);
        console.error("Fetch error message:", fetchError.message);
        console.error("Fetch error stack:", fetchError.stack);
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Error deleting from WordPress:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + error.message);
    }
  } else {
    console.log("No WordPress post ID associated with this announcement, skipping WordPress deletion");
  }

  // Delete the announcement from Supabase
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error('Failed to delete announcement');
  }
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (id: string): Promise<void> => {
  // Récupérer les informations de l'annonce
  const { data: announcement, error: fetchError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching announcement for publishing:", fetchError);
    throw new Error('Failed to fetch announcement details');
  }

  const response = await fetch(`/api/announcements/${id}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      status: 'published',  // Directement publié sans étapes intermédiaires
      skip_draft: true,     // Flag pour indiquer de sauter l'étape brouillon
      announcement: announcement // Envoyer les données complètes de l'annonce pour traitement
    })
  });
  
  // Vérification détaillée de la réponse
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error publishing announcement:", response.status, errorText);
    throw new Error(`Failed to publish announcement: ${response.status} ${errorText}`);
  }

  // Mettre à jour le status dans la base de données locale si l'API a réussi
  const { error: updateError } = await supabase
    .from("announcements")
    .update({ status: "published" })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating local announcement status:", updateError);
    toast.warning("L'annonce a été publiée sur WordPress mais son statut n'a pas été mis à jour localement");
  }
};

/**
 * Publish announcement directly through WordPress
 * Cette fonction est une alternative si l'API ne fonctionne pas
 */
export const publishAnnouncementDirect = async (id: string, userId: string): Promise<void> => {
  try {
    console.log("Attempting direct WordPress publication for announcement:", id);
    
    // Récupérer l'annonce
    const { data: announcement, error: fetchError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !announcement) {
      console.error("Error fetching announcement:", fetchError);
      throw new Error('Failed to fetch announcement');
    }

    // Récupérer la configuration WordPress
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wordpress_config_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      throw new Error("Configuration WordPress introuvable");
    }
    
    // Récupérer les détails de la configuration
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('site_url, app_username, app_password')
      .eq('id', userProfile.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      throw new Error("Détails de configuration WordPress introuvables");
    }

    // Normaliser l'URL
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;
    
    // Déterminer le point d'accès
    let apiEndpoint = 'dipi_cpt';
    try {
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
        method: 'HEAD',
      });
      
      if (response.status === 404) {
        apiEndpoint = 'pages';
      }
    } catch (error) {
      apiEndpoint = 'pages';
    }
    
    console.log("Using WordPress API endpoint:", apiEndpoint);
    
    // Préparer les en-têtes
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (wpConfig.app_username && wpConfig.app_password) {
      const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else {
      throw new Error("Identifiants WordPress manquants");
    }
    
    // Préparer les données pour WordPress
    const wpPostData: any = {
      title: announcement.title,
      content: announcement.description || "",
      status: "publish",
    };
    
    // Ajouter la catégorie si disponible
    if (announcement.wordpress_category_id) {
      wpPostData.dipi_cpt_category = [parseInt(announcement.wordpress_category_id)];
    }
    
    // Ajouter les métadonnées SEO si disponibles
    if (announcement.seo_title || announcement.seo_description || announcement.seo_slug) {
      wpPostData.meta = {
        _yoast_wpseo_title: announcement.seo_title || "",
        _yoast_wpseo_metadesc: announcement.seo_description || "",
      };
      
      if (announcement.seo_slug) {
        wpPostData.slug = announcement.seo_slug;
      }
    }
    
    // Envoyer la requête à WordPress
    const apiUrl = `${siteUrl}/wp-json/wp/v2/${apiEndpoint}`;
    console.log("Sending POST request to WordPress:", apiUrl);
    
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(wpPostData)
    });
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`WordPress API error (${postResponse.status}): ${errorText}`);
    }
    
    const wpResponseData = await postResponse.json();
    console.log("WordPress response:", wpResponseData);
    
    // Mettre à jour l'annonce avec l'ID du post WordPress
    if (wpResponseData && wpResponseData.id) {
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ 
          wordpress_post_id: wpResponseData.id,
          status: "published"
        })
        .eq("id", announcement.id);
        
      if (updateError) {
        console.error("Error updating announcement with WordPress ID:", updateError);
        toast.warning("L'annonce a été publiée sur WordPress mais l'ID n'a pas pu être enregistré");
      }
    }
    
    toast.success("Annonce publiée avec succès sur WordPress");
  } catch (error: any) {
    console.error("Error in direct WordPress publication:", error);
    throw error;
  }
};
