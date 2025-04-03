
"use client"

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { toast } from "@/hooks/use-toast";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import PublishingLoadingOverlay, { PublishingStep } from "@/components/announcements/PublishingLoadingOverlay";
import StepIndicator from "@/components/announcements/steps/StepIndicator";
import CategoryStep from "@/components/announcements/steps/CategoryStep";
import DescriptionStep from "@/components/announcements/steps/DescriptionStep";
import ImagesStep from "@/components/announcements/steps/ImagesStep";
import SeoStep from "@/components/announcements/steps/SeoStep";
import PublishingStep from "@/components/announcements/steps/PublishingStep";
import StepNavigation from "@/components/announcements/steps/StepNavigation";
import AnnouncementSummary from "@/components/announcements/steps/AnnouncementSummary";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { AnnouncementFormData } from "@/components/announcements/AnnouncementForm";

const FORM_STORAGE_KEY = "announcement-form-draft";

const steps = [
  "Catégorie",
  "Description",
  "Images",
  "SEO",
  "Publication",
  "Résumé"
];

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing, publishingState, resetPublishingState } = useWordPressPublishing();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showPublishingOverlay, setShowPublishingOverlay] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { categories } = useWordPressCategories();
  
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

  // Define the publishing steps
  const publishingSteps: PublishingStep[] = [
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

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // If we have publishDate as string, convert it to Date
        if (parsedData.publishDate) {
          parsedData.publishDate = new Date(parsedData.publishDate);
        }
        
        Object.keys(parsedData).forEach(key => {
          form.setValue(key as keyof AnnouncementFormData, parsedData[key]);
        });
        
        console.log("Loaded saved form data:", parsedData);
      } catch (e) {
        console.error("Error parsing saved form data:", e);
      }
    }
  }, [form]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (Object.values(value).some(v => v !== undefined)) {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(value));
      }
    });
    
    return () => subscription.unsubscribe();
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
      localStorage.removeItem(FORM_STORAGE_KEY);
      
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
    if (currentStep > 0) {
      setCurrentStep(current => current - 1);
    }
  };

  const handleNext = () => {
    // Basic validation before proceeding
    if (currentStep === 0 && !form.getValues().wordpressCategory) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner une catégorie avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 1 && !form.getValues().title) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un titre avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(current => current + 1);
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
    <PageLayout 
      title="Créer une nouvelle annonce" 
      titleAction={
        <Button variant="outline" size="sm" onClick={() => navigate("/announcements")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux annonces
        </Button>
      } 
      fullWidthMobile={true}
      containerClassName="max-w-4xl mx-auto"
    >
      <AnimatedContainer delay={200} className={isMobile ? "pb-6" : ""}>
        <div>
          {isMobile && (
            <div className="bg-muted/30 px-4 py-3 mb-4 text-sm text-muted-foreground flex items-center">
              <Wand2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Utilisez les boutons <b>Générer</b> pour améliorer votre contenu avec l'IA.</span>
            </div>
          )}
          
          <StepIndicator 
            steps={steps} 
            currentStep={currentStep} 
            isMobile={isMobile} 
          />
          
          <form>
            <div className={isMobile ? "px-4" : ""}>
              {currentStep === 0 && (
                <CategoryStep form={form} isMobile={isMobile} />
              )}
              
              {currentStep === 1 && (
                <DescriptionStep form={form} isMobile={isMobile} />
              )}
              
              {currentStep === 2 && (
                <ImagesStep form={form} isMobile={isMobile} />
              )}
              
              {currentStep === 3 && (
                <SeoStep form={form} isMobile={isMobile} />
              )}
              
              {currentStep === 4 && (
                <PublishingStep form={form} isMobile={isMobile} />
              )}
              
              {currentStep === 5 && (
                <AnnouncementSummary 
                  data={form.getValues()} 
                  isMobile={isMobile}
                  categoryName={getCategoryName()}
                />
              )}
            </div>
            
            <StepNavigation 
              currentStep={currentStep}
              totalSteps={steps.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isLastStep={currentStep === steps.length - 1}
              isFirstStep={currentStep === 0}
              isSubmitting={isSubmitting || isPublishing}
              isMobile={isMobile}
            />
          </form>
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
