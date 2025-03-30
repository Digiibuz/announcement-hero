
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    publishToWordPress,
    isPublishing
  } = useWordPressPublishing();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Prepare the announcement data
      const announcementData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status || "draft",
        images: data.images || [],
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null,
        seo_title: data.seoTitle || null,
        seo_description: data.seoDescription || null,
        seo_slug: data.seoSlug || null
      };
      console.log("Enregistrement de l'annonce:", announcementData);

      // Save to Supabase
      const {
        data: newAnnouncement,
        error
      } = await supabase.from("announcements").insert(announcementData).select().single();
      if (error) throw error;
      console.log("Annonce enregistrée dans Supabase:", newAnnouncement);

      // If status is published or scheduled, try to publish to WordPress
      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        console.log("Tentative de publication sur WordPress...");
        wordpressResult = await publishToWordPress(newAnnouncement as Announcement, data.wordpressCategory, user.id);
        
        // Save WordPress post ID to the announcement if publishing succeeded
        if (wordpressResult.success && wordpressResult.wordpressPostId) {
          console.log("Mise à jour de l'annonce avec l'ID WordPress:", wordpressResult.wordpressPostId);
          
          const { error: updateError } = await supabase
            .from("announcements")
            .update({ wordpress_post_id: wordpressResult.wordpressPostId })
            .eq("id", newAnnouncement.id);
            
          if (updateError) {
            console.error("Erreur lors de la mise à jour de l'ID WordPress:", updateError);
          }
        }
      }
      
      if (wordpressResult.success) {
        toast.success("Annonce enregistrée avec succès");
      } else {
        toast.warning("Annonce enregistrée dans la base de données, mais la publication WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"));
      }

      // Redirect to the announcements list
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout 
      title="Créer une nouvelle annonce" 
      titleAction={
        <Button variant="outline" size="sm" onClick={() => navigate("/announcements")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux annonces
        </Button>
      } 
      fullWidthMobile={true}
      containerClassName="max-w-5xl mx-auto"
    >
      <AnimatedContainer delay={200} className={isMobile ? "pb-6" : ""}>
        {!isMobile && (
          <div className="mb-4">
            {/* Empty space for desktop view if needed */}
          </div>
        )}
        
        <div>
          {isMobile && (
            <div className="bg-muted/30 px-4 py-3 mb-4 text-sm text-muted-foreground flex items-center">
              <Wand2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Utilisez les boutons <b>Optimiser</b> pour améliorer votre contenu avec l'IA.</span>
            </div>
          )}
          
          <AnnouncementForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting || isPublishing} 
            isMobile={isMobile} 
          />
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default CreateAnnouncement;
