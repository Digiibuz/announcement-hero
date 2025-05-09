
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase, typedData } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { Announcement } from "@/types/announcement";

export interface ExtendedAnnouncement extends Omit<Announcement, 'wordpress_post_id'> {
  wordpress_post_id?: number | null;
  wordpress_site_url?: string;
  wordpress_published_at?: string;
  is_divipixel?: boolean;
}

export const useAnnouncementDetail = (userId: string | undefined) => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<ExtendedAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isPublishing } = useWordPressPublishing();
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
        
        // Convert the data to a properly typed ExtendedAnnouncement
        const typedAnnouncement: ExtendedAnnouncement = {
          id: typedData<string>(data.id),
          title: typedData<string>(data.title),
          description: typedData<string>(data.description),
          status: typedData<"draft" | "published" | "scheduled">(data.status),
          images: typedData<string[]>(data.images) || [],
          created_at: typedData<string>(data.created_at),
          updated_at: typedData<string>(data.updated_at),
          user_id: typedData<string>(data.user_id),
          publish_date: typedData<string>(data.publish_date) || null,
          wordpress_post_id: typedData<number | null>(data.wordpress_post_id),
          wordpress_category_id: typedData<string>(data.wordpress_category_id) || null,
          seo_title: typedData<string>(data.seo_title) || "",
          seo_description: typedData<string>(data.seo_description) || "",
          seo_slug: typedData<string>(data.seo_slug) || "",
          is_divipixel: typedData<boolean>(data.is_divipixel) || false
        };
        
        setAnnouncement(typedAnnouncement);
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
        seoSlug: announcement.seo_slug || "",
        is_divipixel: announcement.is_divipixel || false
      });
    }
  }, [announcement, isEditing]);

  const handleSubmit = async (formData: any) => {
    if (!id || !userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Update announcement in database
      const { error } = await supabase
        .from("announcements")
        .update(formData)
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Annonce mise à jour avec succès");
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
    formData
  };
};
