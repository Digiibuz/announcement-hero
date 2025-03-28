
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing } = useWordPressPublishing();

  // Fetch the announcement data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      if (!id) throw new Error("Announcement ID is required");
      
      let query = supabase
        .from("announcements")
        .select("*")
        .filter("id", "eq", id)
        .single();
        
      const { data, error } = await query;
      
      if (error) {
        toast.error("Erreur lors du chargement de l'annonce");
        navigate("/announcements");
        throw error;
      }
      
      // Check if current user has access to this announcement
      if (!isAdmin && data.user_id !== user?.id) {
        toast.error("Vous n'avez pas accès à cette annonce");
        navigate("/announcements");
        throw new Error("Access denied");
      }
      
      return data;
    },
    enabled: !!id && !!user,
  });

  const handleSubmit = async (formData: any) => {
    if (!id || !user) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the announcement data
      const announcementData = {
        title: formData.title,
        description: formData.description,
        status: formData.status || "draft",
        images: formData.images || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null,
        updated_at: new Date().toISOString()
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from("announcements")
        .update(announcementData)
        .filter("id", "eq", id);
      
      if (error) throw error;
      
      // If status is published or scheduled, try to publish to WordPress
      let wordpressResult = { success: true, message: "" };
      if ((formData.status === 'published' || formData.status === 'scheduled') && formData.wordpressCategory) {
        const updatedAnnouncement = {
          ...data as Announcement,
          ...announcementData
        };
        
        wordpressResult = await publishToWordPress(
          updatedAnnouncement,
          formData.wordpressCategory,
          user.id
        );
      }
      
      if (wordpressResult.success) {
        toast.success("Annonce mise à jour avec succès");
      } else {
        toast.warning("Annonce enregistrée dans la base de données, mais la mise à jour WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"));
      }
      
      // Refetch the data to update the UI
      await refetch();
      
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      toast.error("Erreur lors de la mise à jour: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="Modifier l'annonce">
      <AnimatedContainer delay={200}>
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          ) : (
            <AnnouncementForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting || isPublishing}
              initialData={data as Announcement}
              isEditing
            />
          )}
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default AnnouncementDetail;
