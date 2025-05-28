
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { Announcement } from "@/types/announcement";

export interface ExtendedAnnouncement extends Omit<Announcement, 'wordpress_post_id'> {
  wordpress_post_id?: number | null;
  wordpress_site_url?: string;
  wordpress_published_at?: string;
}

export const useAnnouncementDetail = (userId: string | undefined) => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<ExtendedAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isPublishing, publishToWordPress } = useWordPressPublishing();
  const { canPublish, stats } = usePublicationLimits();
  const [activeTab, setActiveTab] = useState("preview");
  const [formData, setFormData] = useState<any>(null);

  // Utiliser useCallback pour éviter les rendus inutiles
  const fetchAnnouncement = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!id) return;

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        console.log("Loaded announcement:", data);
        console.log("WordPress post ID:", data.wordpress_post_id);
        // Format data for the form
        setAnnouncement(data as ExtendedAnnouncement);
      }
    } catch (error: any) {
      console.error("Error fetching announcement:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  useEffect(() => {
    // Automatically switch to edit mode when viewing a draft announcement
    if (announcement && announcement.status === 'draft' && !isEditing) {
      setIsEditing(true);
      setActiveTab("edit");
    }

    // Prepare form data from announcement
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        description: announcement.description || "",
        wordpressCategory: announcement.wordpress_category_id || "",
        publishDate: announcement.publish_date ? new Date(announcement.publish_date) : undefined,
        status: announcement.status || "draft",
        images: announcement.images || [],
        seoTitle: announcement.seo_title || "",
        seoDescription: announcement.seo_description || "",
        seoSlug: announcement.seo_slug || ""
      });
    }
  }, [announcement, isEditing]);

  const handleSubmit = async (formData: any) => {
    if (!id || !userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Check publication limits if trying to publish or schedule
      if ((formData.status === 'published' || formData.status === 'scheduled') && !canPublish()) {
        toast.error(`Limite de ${stats.maxLimit} publications atteinte ce mois-ci. Votre annonce sera sauvegardée en brouillon.`);
        
        // Force the status to draft if limit is reached
        formData.status = 'draft';
      }
      
      // Map form data to database column names
      const updateData = {
        title: formData.title,
        description: formData.description,
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        status: formData.status,
        images: formData.images || [],
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null
      };
      
      // Update announcement in database
      const { error } = await supabase
        .from("announcements")
        .update(updateData)
        .eq("id", id);
        
      if (error) throw error;
      
      // Improved WordPress synchronization logic - use the announcement owner's user_id
      const shouldSyncWithWordPress = announcement?.wordpress_post_id && 
                                     announcement?.wordpress_category_id &&
                                     (announcement.status === 'published' || formData.status === 'published');
      
      if (shouldSyncWithWordPress) {
        try {
          console.log("Synchronizing changes with WordPress...");
          
          // Get the updated announcement data
          const { data: updatedAnnouncement, error: fetchError } = await supabase
            .from("announcements")
            .select("*")
            .eq("id", id)
            .single();

          if (fetchError) throw fetchError;

          if (updatedAnnouncement) {
            // IMPORTANT: Use the announcement owner's user_id for WordPress sync, not the current user's ID
            const announcementOwnerId = updatedAnnouncement.user_id;
            
            const result = await publishToWordPress(
              updatedAnnouncement,
              updatedAnnouncement.wordpress_category_id,
              announcementOwnerId // Use the original owner's ID for WordPress config
            );

            if (result.success) {
              toast.success("Annonce mise à jour avec succès et synchronisée avec WordPress");
            } else {
              toast.warning("Annonce mise à jour localement, mais erreur de synchronisation WordPress");
              console.error("WordPress sync error:", result.message);
            }
          }
        } catch (wordpressError: any) {
          console.error("Error syncing with WordPress:", wordpressError);
          toast.warning("Annonce mise à jour localement, mais erreur de synchronisation WordPress");
        }
      } else {
        toast.success("Annonce mise à jour avec succès");
      }
      
      await fetchAnnouncement();
      setIsEditing(false);
      setActiveTab("preview");
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    announcement,
    isLoading,
    isEditing,
    setIsEditing,
    isSubmitting,
    isPublishing,
    activeTab,
    setActiveTab,
    fetchAnnouncement,
    handleSubmit,
    formData,
    canPublish,
    publicationStats: stats
  };
};
