
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
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing } = useWordPressPublishing();

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
      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Annonce enregistrée dans Supabase:", newAnnouncement);
      
      // If status is published or scheduled, try to publish to WordPress
      let wordpressResult = { success: true, message: "" };
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        console.log("Tentative de publication sur WordPress...");
        wordpressResult = await publishToWordPress(
          newAnnouncement as Announcement, 
          data.wordpressCategory,
          user.id
        );
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
    >
      <AnimatedContainer delay={200}>
        <div className="max-w-5xl mx-auto">
          <Alert className="mb-6">
            <Wand2 className="h-4 w-4" />
            <AlertDescription>
              Utilisez les boutons <span className="font-medium inline-flex items-center mx-1"><Wand2 className="h-3 w-3 mr-1" /> Optimiser</span> pour améliorer automatiquement votre contenu et vos métadonnées SEO grâce à l'intelligence artificielle.
            </AlertDescription>
          </Alert>
          
          <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <AnnouncementForm 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting || isPublishing} 
              />
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default CreateAnnouncement;
