"use client"

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { toast } from "@/hooks/use-toast";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { ArrowLeft, Wand2, FileImage, Server, Database, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import PublishingLoadingOverlay, { PublishingStep } from "@/components/announcements/PublishingLoadingOverlay";

const FORM_STORAGE_KEY = "announcement-form-draft";

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing, publishingState, resetPublishingState } = useWordPressPublishing();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showPublishingOverlay, setShowPublishingOverlay] = useState(false);

  // Define the publishing steps
  const publishingSteps: PublishingStep[] = [
    {
      id: "prepare",
      label: "Préparation de la publication",
      status: publishingState.steps.prepare?.status || "idle",
      icon: <FileCheck className="h-5 w-5 text-muted-foreground" />
    },
    {
      id: "image",
      label: "Téléversement de l'image principale",
      status: publishingState.steps.image?.status || "idle",
      icon: <FileImage className="h-5 w-5 text-muted-foreground" />
    },
    {
      id: "wordpress",
      label: "Publication sur WordPress",
      status: publishingState.steps.wordpress?.status || "idle",
      icon: <Server className="h-5 w-5 text-muted-foreground" />
    },
    {
      id: "database",
      label: "Mise à jour de la base de données",
      status: publishingState.steps.database?.status || "idle",
      icon: <Database className="h-5 w-5 text-muted-foreground" />
    }
  ];

  // Function to handle beforeunload event when leaving the page
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData && Object.keys(JSON.parse(savedData)).length > 1) {
        // Show confirmation only if there's meaningful saved data
        const message = "Vous avez un brouillon non publié. Êtes-vous sûr de vouloir quitter ?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setShowPublishingOverlay(true);
      
      // Effacer les données sauvegardées du formulaire dans le localStorage
      localStorage.removeItem(FORM_STORAGE_KEY);
      
      // Show immediate feedback on mobile
      if (isMobile) {
        toast({
          title: "Traitement en cours",
          description: "Enregistrement de votre annonce...",
        });
      }

      // Prepare the announcement data
      const announcementData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status as "draft" | "published" | "scheduled",
        images: data.images || [],
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null,
        seo_title: data.seoTitle || null,
        seo_description: data.seoDescription || null,
        seo_slug: data.seoSlug || null
      };
      
      // Save to Supabase
      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Feedback on successful save
      toast({
        title: "Succès",
        description: "Annonce enregistrée avec succès" + (isMobile ? ", publication en cours..." : ""),
      });

      // If status is published or scheduled, try to publish to WordPress
      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        // For mobile, we don't need to show this toast since we already showed feedback
        if (!isMobile) {
          toast({
            title: "WordPress",
            description: "Publication de l'annonce sur WordPress en cours..."
          });
        }
        
        wordpressResult = await publishToWordPress(
          newAnnouncement as Announcement, 
          data.wordpressCategory, 
          user.id
        );
        
        if (wordpressResult.success) {
          if (wordpressResult.wordpressPostId) {
            toast({
              title: "WordPress",
              description: `Publication réussie (ID: ${wordpressResult.wordpressPostId})`,
            });
          }
        } else {
          toast({
            title: "Attention",
            description: "Annonce enregistrée dans la base de données, mais la publication WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"),
            variant: "destructive"
          });
        }
      }

      // Hide the overlay after a short delay to allow the user to see the completion
      setTimeout(() => {
        setShowPublishingOverlay(false);
        resetPublishingState();
        // Redirect to the announcements list
        navigate("/announcements");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement: " + error.message,
        variant: "destructive"
      });
      setShowPublishingOverlay(false);
      resetPublishingState();
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
              <span>Utilisez les boutons <b>Générer</b> pour améliorer votre contenu avec l'IA.</span>
            </div>
          )}
          
          <AnnouncementForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting || isPublishing} 
            isMobile={isMobile}
            storageKey={FORM_STORAGE_KEY}
          />
        </div>
      </AnimatedContainer>
      
      <PublishingLoadingOverlay
        isOpen={showPublishingOverlay}
        steps={publishingSteps}
        currentStepId={publishingState.currentStep}
        progress={publishingState.progress}
      />
    </PageLayout>
  );
};

export default CreateAnnouncement;
