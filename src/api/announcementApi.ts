
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
    // Delete from WordPress using a direct fetch call to our API endpoint
    try {
      const response = await fetch(`/api/announcements/${id}/delete-wordpress`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordpressPostId: announcement.wordpress_post_id,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error deleting from WordPress:", errorText);
        toast.error("L'annonce a été supprimée de l'application, mais pas de WordPress: " + errorText);
      }
    } catch (error: any) {
      console.error("Error calling WordPress delete API:", error);
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
