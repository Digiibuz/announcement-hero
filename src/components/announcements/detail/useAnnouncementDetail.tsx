

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
      if (!id) {
        console.warn("No announcement ID provided");
        return;
      }

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error fetching announcement:", error);
        throw error;
      }

      if (data) {
        console.log("Loaded announcement:", data);
        console.log("WordPress post ID:", data.wordpress_post_id);
        console.log("Additional medias from DB:", data.additional_medias);
        
        // Mapper les données de la base vers le format TypeScript avec des valeurs par défaut sûres
        const mappedAnnouncement = {
          ...data,
          additionalMedias: Array.isArray(data.additional_medias) ? data.additional_medias : [],
          images: Array.isArray(data.images) ? data.images : [],
          facebook_hashtags: Array.isArray(data.facebook_hashtags) ? data.facebook_hashtags : [],
          facebook_images: Array.isArray(data.facebook_images) ? data.facebook_images : [],
          instagram_hashtags: Array.isArray(data.instagram_hashtags) ? data.instagram_hashtags : [],
          instagram_images: Array.isArray(data.instagram_images) ? data.instagram_images : []
        } as ExtendedAnnouncement;
        
        setAnnouncement(mappedAnnouncement);
      } else {
        console.warn("No announcement data returned");
        toast.error("Annonce introuvable");
      }
    } catch (error: any) {
      console.error("Error fetching announcement:", error);
      const errorMessage = error?.message || "Erreur inconnue lors du chargement de l'annonce";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  useEffect(() => {
    try {
      // Automatically switch to edit mode when viewing a draft announcement
      if (announcement && announcement.status === 'draft' && !isEditing) {
        setIsEditing(true);
        setActiveTab("edit");
      }

      // Prepare form data from announcement
      if (announcement) {
        console.log("Setting form data with additional medias:", announcement.additionalMedias);
        setFormData({
          title: announcement.title || "",
          description: announcement.description || "",
          wordpressCategory: announcement.wordpress_category_id || "",
          publishDate: announcement.publish_date ? new Date(announcement.publish_date) : undefined,
          status: announcement.status || "draft",
          images: Array.isArray(announcement.images) ? announcement.images : [],
          additionalMedias: Array.isArray(announcement.additionalMedias) ? announcement.additionalMedias : [],
          seoTitle: announcement.seo_title || "",
          seoDescription: announcement.seo_description || "",
          seoSlug: announcement.seo_slug || "",
          createFacebookPost: announcement.create_facebook_post || false,
          facebookContent: announcement.facebook_content || "",
          facebookHashtags: Array.isArray(announcement.facebook_hashtags) ? announcement.facebook_hashtags : [],
          facebookImages: Array.isArray(announcement.facebook_images) ? announcement.facebook_images : [],
          createInstagramPost: announcement.create_instagram_post || false,
          instagramContent: announcement.instagram_content || "",
          instagramHashtags: Array.isArray(announcement.instagram_hashtags) ? announcement.instagram_hashtags : [],
          instagramImages: Array.isArray(announcement.instagram_images) ? announcement.instagram_images : []
        });
      }
    } catch (error) {
      console.error("Error preparing form data:", error);
      toast.error("Erreur lors de la préparation des données du formulaire");
    }
  }, [announcement, isEditing]);

  const handleSubmit = async (formData: any) => {
    if (!id || !userId) {
      console.error("Missing ID or userId for announcement update");
      toast.error("Erreur: Informations manquantes pour la mise à jour");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Check publication limits if trying to publish or schedule
      if ((formData.status === 'published' || formData.status === 'scheduled') && !canPublish()) {
        toast.error(`Limite de ${stats.maxLimit} publications atteinte ce mois-ci. Votre annonce sera sauvegardée en brouillon.`);
        
        // Force the status to draft if limit is reached
        formData.status = 'draft';
      }
      
      console.log("Updating announcement with additional medias:", formData.additionalMedias);
      
      // Map form data to database column names with safe defaults
      const updateData = {
        title: formData.title || "",
        description: formData.description || "",
        wordpress_category_id: formData.wordpressCategory || null,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        status: formData.status || "draft",
        images: Array.isArray(formData.images) ? formData.images : [],
        additional_medias: Array.isArray(formData.additionalMedias) ? formData.additionalMedias : [],
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null,
        create_facebook_post: formData.createFacebookPost || false,
        facebook_content: formData.facebookContent || null,
        facebook_hashtags: Array.isArray(formData.facebookHashtags) ? formData.facebookHashtags : [],
        facebook_images: Array.isArray(formData.facebookImages) ? formData.facebookImages : [],
        create_instagram_post: formData.createInstagramPost || false,
        instagram_content: formData.instagramContent || null,
        instagram_hashtags: Array.isArray(formData.instagramHashtags) ? formData.instagramHashtags : [],
        instagram_images: Array.isArray(formData.instagramImages) ? formData.instagramImages : []
      };
      
      // Update announcement in database
      const { error } = await supabase
        .from("announcements")
        .update(updateData)
        .eq("id", id);
        
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
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
            
            // Map DB data to Announcement format for WordPress sync
            const announcementForWordPress = {
              ...updatedAnnouncement,
              additionalMedias: updatedAnnouncement.additional_medias || []
            } as Announcement;
            
            const result = await publishToWordPress(
              announcementForWordPress,
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

