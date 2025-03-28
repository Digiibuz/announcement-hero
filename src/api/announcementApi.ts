
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
      } else {
        throw new Error("Aucune méthode d'authentification disponible pour WordPress");
      }
      
      console.log("Sending WordPress deletion request...");
      
      // Send DELETE request to WordPress
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
    } catch (error: any) {
      console.error("Error deleting from WordPress:", error);
      toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + error.message);
    }
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
  const response = await fetch(`/api/announcements/${id}/publish`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to publish announcement');
  }
};
