
"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
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
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const {
    publishToWordPress,
    isPublishing,
    publishingState,
    resetPublishingState
  } = useWordPressPublishing();
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

  // Clear form data when the component mounts
  useEffect(() => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    form.reset({
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "published",
      images: [],
      seoTitle: "",
      seoDescription: "",
      seoSlug: ""
    });
  }, [form]);

  // Use the form persistence hook
  const {
    clearSavedData,
    hasSavedData,
    saveData
  } = useFormPersistence(form, FORM_STORAGE_KEY, undefined,
    5000, // autosave every 5 seconds
    false, // no debug
    undefined // watch all fields
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
      const hasContent = formData.title || formData.description || formData.images && formData.images.length > 0;
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
    const subscription = form.watch((value, {
      name
    }) => {
      if (name === 'title') {
        const title = value.title as string;
        if (title) {
          if (!form.getValues("seoTitle")) {
            form.setValue("seoTitle", title);
          }
          const normalizedTitle = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
          form.setValue("seoSlug", normalizedTitle);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const saveAnnouncementDraft = async () => {
    try {
      setIsSavingDraft(true);
      
      if (!user?.id) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour enregistrer un brouillon",
          variant: "destructive"
        });
        return;
      }

      const formData = form.getValues();

      // Ensure draft status for this save operation
      const announcementData = {
        user_id: user.id,
        title: formData.title || "Brouillon sans titre",
        description: formData.description,
        status: "draft" as "draft",
        images: formData.images || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null
      };

      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Brouillon enregistré avec succès"
      });

      // Clear the form data from localStorage since it's now saved in the database
      clearSavedData();
      
      // Reset the form to clear all fields
      form.reset({
        title: "",
        description: "",
        wordpressCategory: "",
        publishDate: undefined,
        status: "published",
        images: [],
        seoTitle: "",
        seoDescription: "",
        seoSlug: ""
      });
      
      // Navigate to announcements page to see the draft
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du brouillon: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowPublishingOverlay(true);

      clearSavedData();

      if (isMobile) {
        toast({
          title: "Traitement en cours",
          description: "Enregistrement de votre annonce..."
        });
      }

      const formData = form.getValues();

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

      const {
        data: newAnnouncement,
        error
      } = await supabase.from("announcements").insert(announcementData).select().single();
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Annonce enregistrée avec succès" + (isMobile ? ", publication en cours..." : "")
      });

      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      if ((formData.status === 'published' || formData.status === 'scheduled') && formData.wordpressCategory && user?.id) {
        if (!isMobile) {
          toast({
            title: "WordPress",
            description: "Publication de l'annonce sur WordPress en cours..."
          });
        }
        wordpressResult = await publishToWordPress(newAnnouncement as Announcement, formData.wordpressCategory, user.id);
        if (wordpressResult.success) {
          if (wordpressResult.wordpressPostId) {
            toast({
              title: "WordPress",
              description: `Publication réussie (ID: ${wordpressResult.wordpressPostId})`
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

      // Reset the form to clear all fields
      form.reset({
        title: "",
        description: "",
        wordpressCategory: "",
        publishDate: undefined,
        status: "published",
        images: [],
        seoTitle: "",
        seoDescription: "",
        seoSlug: ""
      });

      setTimeout(() => {
        setShowPublishingOverlay(false);
        resetPublishingState();
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

  const getCategoryName = () => {
    const categoryId = form.getValues().wordpressCategory;
    if (!categoryId || !categories) return "Non spécifié";
    const category = categories.find(cat => String(cat.id) === categoryId);
    return category ? category.name : "Non spécifié";
  };

  return (
    <div className="min-h-screen bg-background">
      <CreateAnnouncementHeader currentStep={currentStepIndex} totalSteps={stepConfigs.length} />
    
      <div className="pt-16 pb-20 px-4 md:max-w-3xl md:mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full">
            <div className="max-w-3xl mx-auto">
              <div className="my-6">
                <h2 className="text-xl font-semibold mb-1">{currentStep.title}</h2>
                <p className="text-muted-foreground text-sm">{currentStep.description}</p>
              </div>
              
              {currentStep.id === "category" && <CategoryStep form={form} isMobile={isMobile} />}
              
              {currentStep.id === "description" && <DescriptionStep form={form} isMobile={isMobile} />}
              
              {currentStep.id === "images" && <ImagesStep form={form} isMobile={isMobile} />}
              
              {currentStep.id === "seo" && <SeoStep form={form} isMobile={isMobile} />}
              
              {currentStep.id === "publishing" && <PublishingStep form={form} isMobile={isMobile} />}
              
              {currentStep.id === "summary" && <AnnouncementSummary data={form.getValues()} isMobile={isMobile} categoryName={getCategoryName()} />}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
              <StepNavigation 
                currentStep={currentStepIndex} 
                totalSteps={stepConfigs.length} 
                onPrevious={handlePrevious} 
                onNext={handleNext} 
                onSubmit={handleSubmit}
                onSaveDraft={saveAnnouncementDraft}
                isLastStep={currentStepIndex === stepConfigs.length - 1} 
                isFirstStep={currentStepIndex === 0} 
                isSubmitting={isSubmitting || isPublishing || isSavingDraft} 
                isMobile={isMobile} 
                className="bg-transparent border-none max-w-3xl mx-auto" 
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
