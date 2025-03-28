
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { Announcement } from "@/types/announcement";

export interface ExtendedAnnouncement extends Announcement {
  wordpress_post_id?: string;
  wordpress_site_url?: string;
  wordpress_published_at?: string;
}

export const useAnnouncementDetail = (userId: string | undefined) => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<ExtendedAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isPublishing } = useWordPressPublishing();
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
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
        // Format data for the form
        setAnnouncement(data as ExtendedAnnouncement);
      }
    } catch (error: any) {
      console.error("Error fetching announcement:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
      fetchAnnouncement();
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
    handleSubmit
  };
};
