
"use client"

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import PublishingLoadingOverlay, { PublishingStep as PublishingStepType } from "@/components/announcements/PublishingLoadingOverlay";
import CategoryStep from "@/components/announcements/steps/CategoryStep";
import DescriptionStep from "@/components/announcements/steps/DescriptionStep";
import ImagesStep from "@/components/announcements/steps/ImagesStep";
import SeoStep from "@/components/announcements/steps/SeoStep";
import PublishingStep from "@/components/announcements/steps/PublishingStep";
import StepNavigation from "@/components/announcements/steps/StepNavigation";
import AnnouncementSummary from "@/components/announcements/steps/AnnouncementSummary";
import { Form } from "@/components/ui/form";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { StepConfig, AnnouncementFormStep } from "@/types/steps";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { AnnouncementFormData } from "@/components/announcements/AnnouncementForm";
import CreateAnnouncementHeader from "@/components/announcements/steps/CreateAnnouncementHeader";

const FORM_STORAGE_KEY = "announcement-form-draft";

const stepConfigs: StepConfig[] = [
  {
    id: "category",
    title: "Catégorie",
    description: "Dans quelle page souhaitez-vous faire apparaître votre annonce ?"
  },
  {
    id: "description",
    title: "Description",
    description: "Donnez un titre accrocheur et une description détaillée pour attirer l'attention des lecteurs."
  },
  {
    id: "images",
    title: "Images",
    description: "Les annonces avec des images de qualité attirent davantage l'attention et génèrent plus d'intérêt."
  },
  {
    id: "seo",
    title: "SEO",
    description: "Améliorez la visibilité de votre annonce dans les moteurs de recherche comme Google."
  },
  {
    id: "publishing",
    title: "Publication",
    description: "Définissez quand et comment votre annonce sera publiée."
  },
  {
    id: "summary",
    title: "Résumé",
    description: "Vérifiez les informations de votre annonce avant de la publier."
  }
];

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing, publishingState, resetPublishingState } = useWordPressPublishing();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showPublishingOverlay, setShowPublishingOverlay] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { categories } = useWordPressCategories();
  
  // Get current step config
  const currentStep = stepConfigs[currentStepIndex];
  
  // Initializing the form
  const form = useForm<AnnouncementFormData>({
    defaultValues: {
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "published",
      images: [],
      seoTitle: "",
      seoDescription: "",
      seoSlug: ""
    }
  });

  // Use the form persistence hook
  const { clearSavedData, hasSavedData } = useFormPersistence(
    form,
    FORM_STORAGE_KEY,
    undefined,  // no initial values, will load from storage
    5000,       // autosave every 5 seconds
    false,      // no debug
    undefined   // watch all fields
  );

  // Define the publishing steps
  const publishingSteps: PublishingStepType[] = [
    {
      id: "prepare",
      label: "Préparation de la publication",
      status: publishingState.steps.prepare?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    {
      id: "image",
      label: "Téléversement de l'image principale",
      status: publishingState.steps.image?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    {
      id: "wordpress",
      label: "Publication sur WordPress",
      status: publishingState.steps.wordpress?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    {
      id: "database",
      label: "Mise à jour de la base de données",
      status: publishingState.steps.database?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    }
  ];

  // Function to handle beforeunload event when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const formData = form.getValues();
      const hasContent = formData.title || formData.description || (formData.images && formData.images.length > 0);
      
      if (hasContent) {
        const message = "Vous avez un brouillon non publié. Êtes-vous sûr de vouloir quitter ?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form]);

  // Handle title changes to update SEO title and slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title') {
        const title = value.title as string;
        if (title) {
          // Update SEO title if not already set by user
          if (!form.getValues("seoTitle")) {
            form.setValue("seoTitle", title);
          }
          
          // Update slug
          const normalizedTitle = title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
          
          form.setValue("seoSlug", normalizedTitle);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowPublishingOverlay(true);
      
      // Clear saved form data from localStorage
      clearSavedData();
      
      // Show immediate feedback on mobile
      if (isMobile) {
        toast({
          title: "Traitement en cours",
          description: "Enregistrement de votre annonce...",
        });
      }

      const formData = form.getValues();
      
      // Prepare the announcement data
      const announcementData = {
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        status: formData.status as "draft" | "published" | "scheduled",
        images: formData.images || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null
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
      
      if ((formData.status === 'published' || formData.status === 'scheduled') && formData.wordpressCategory && user?.id) {
        // For mobile, we don't need to show this toast since we already showed feedback
        if (!isMobile) {
          toast({
            title: "WordPress",
            description: "Publication de l'annonce sur WordPress en cours..."
          });
        }
        
        wordpressResult = await publishToWordPress(
          newAnnouncement as Announcement, 
          formData.wordpressCategory, 
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

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(current => current - 1);
    }
  };

  const handleNext = () => {
    // Basic validation before proceeding
    if (currentStepIndex === 0 && !form.getValues().wordpressCategory) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner une catégorie avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    if (currentStepIndex === 1 && !form.getValues().title) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un titre avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    if (currentStepIndex < stepConfigs.length - 1) {
      setCurrentStepIndex(current => current + 1);
    }
  };

  // Get the current category name for the summary
  const getCategoryName = () => {
    const categoryId = form.getValues().wordpressCategory;
    if (!categoryId || !categories) return "Non spécifié";
    
    const category = categories.find(cat => String(cat.id) === categoryId);
    return category ? category.name : "Non spécifié";
  };

  return (
    <div className="min-h-screen bg-background">
      <CreateAnnouncementHeader 
        currentStep={currentStepIndex} 
        totalSteps={stepConfigs.length} 
      />
    
      <div className="pt-16 pb-20 px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full">
            <div className="px-4">
              {isMobile && (
                <div className="bg-muted/30 px-4 py-3 mb-4 text-sm text-muted-foreground flex items-center rounded-md">
                  <Wand2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Utilisez les boutons <b>Générer</b> pour améliorer votre contenu avec l'IA.</span>
                </div>
              )}
              
              <div className="my-6">
                <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
                <p className="text-muted-foreground">{currentStep.description}</p>
              </div>
              
              {currentStep.id === "category" && (
                <CategoryStep form={form} isMobile={true} />
              )}
              
              {currentStep.id === "description" && (
                <DescriptionStep form={form} isMobile={true} />
              )}
              
              {currentStep.id === "images" && (
                <ImagesStep form={form} isMobile={true} />
              )}
              
              {currentStep.id === "seo" && (
                <SeoStep form={form} isMobile={true} />
              )}
              
              {currentStep.id === "publishing" && (
                <PublishingStep form={form} isMobile={true} />
              )}
              
              {currentStep.id === "summary" && (
                <AnnouncementSummary 
                  data={form.getValues()} 
                  isMobile={true}
                  categoryName={getCategoryName()}
                />
              )}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
              <StepNavigation 
                currentStep={currentStepIndex}
                totalSteps={stepConfigs.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isLastStep={currentStepIndex === stepConfigs.length - 1}
                isFirstStep={currentStepIndex === 0}
                isSubmitting={isSubmitting || isPublishing}
                isMobile={true}
                className="bg-transparent border-none"
              />
            </div>
          </form>
        </Form>
      </div>
      
      <PublishingLoadingOverlay
        isOpen={showPublishingOverlay}
        steps={publishingSteps}
        currentStepId={publishingState.currentStep}
        progress={publishingState.progress}
      />
    </div>
  );
};

export default CreateAnnouncement;
