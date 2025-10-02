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
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import PublishingLoadingOverlay, { PublishingStep as PublishingStepType } from "@/components/announcements/PublishingLoadingOverlay";
import CategoryStep from "@/components/announcements/steps/CategoryStep";
import DescriptionStep from "@/components/announcements/steps/DescriptionStep";
import ImagesStep from "@/components/announcements/steps/ImagesStep";
import SocialStep from "@/components/announcements/steps/SocialStep";
import PublishingStep from "@/components/announcements/steps/PublishingStep";
import StepNavigation from "@/components/announcements/steps/StepNavigation";
import AnnouncementSummary from "@/components/announcements/steps/AnnouncementSummary";
import { Form } from "@/components/ui/form";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { StepConfig, AnnouncementFormStep } from "@/types/steps";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { AnnouncementFormData } from "@/components/announcements/AnnouncementForm";
import CreateAnnouncementHeader from "@/components/announcements/steps/CreateAnnouncementHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp } from "lucide-react";
import DynamicBackground from "@/components/ui/DynamicBackground";

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
    title: "",
    description: ""
  },
  {
    id: "social",
    title: "Réseaux sociaux",
    description: "Adaptez votre contenu pour les réseaux sociaux et programmez votre publication."
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
  const { canPublish, incrementPublicationCount, stats } = usePublicationLimits();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showPublishingOverlay, setShowPublishingOverlay] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { categories } = useWordPressCategories();

  const currentStep = stepConfigs[currentStepIndex];

  const form = useForm<AnnouncementFormData>({
    defaultValues: {
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "published",
      images: [],
      additionalMedias: [], // NEW FIELD
      seoTitle: "",
      seoDescription: "",
      seoSlug: ""
    }
  });

  // Clear form data when component mounts
  useEffect(() => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    form.reset({
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "published",
      images: [],
      additionalMedias: [], // NEW FIELD
      seoTitle: "",
      seoDescription: "",
      seoSlug: ""
    });
  }, [form]);

  const {
    clearSavedData,
    hasSavedData,
    saveData
  } = useFormPersistence(form, FORM_STORAGE_KEY);

  const publishingSteps: PublishingStepType[] = [
    {
      id: "prepare",
      label: "Préparation de la publication",
      status: publishingState.steps.prepare?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    {
      id: "compress",
      label: "Compression optimisée de l'image",
      status: publishingState.steps.compress?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    {
      id: "wordpress",
      label: "Publication sur WordPress",
      status: publishingState.steps.wordpress?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    },
    // Ajouter l'étape Facebook conditionnellement
    ...(form.getValues('createFacebookPost') === true ? [{
      id: "facebook",
      label: "Publication sur Facebook",
      status: publishingState.steps.facebook?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    }] : []),
    {
      id: "database",
      label: "Mise à jour de la base de données",
      status: publishingState.steps.database?.status || "idle",
      icon: <div className="h-5 w-5 text-muted-foreground"></div>
    }
  ];

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

  useEffect(() => {
    const subscription = form.watch((value, {
      name
    }) => {
      if (name === 'title') {
        const title = value.title as string;
        if (title) {
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
        if (!isMobile) {
          toast({
            title: "Erreur",
            description: "Vous devez être connecté pour enregistrer un brouillon",
            variant: "destructive"
          });
        }
        return;
      }

      const formData = form.getValues();

      if (!formData.title && !formData.description && (!formData.images || formData.images.length === 0)) {
        if (!isMobile) {
          toast({
            title: "Formulaire vide",
            description: "Veuillez remplir au moins un champ avant d'enregistrer un brouillon",
            variant: "destructive"
          });
        }
        setIsSavingDraft(false);
        return;
      }

      const announcementData = {
        user_id: user.id,
        title: formData.title || "Brouillon sans titre",
        description: formData.description,
        status: "draft" as "draft",
        images: formData.images || [],
        additional_medias: formData.additionalMedias || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null,
        create_facebook_post: formData.createFacebookPost || false,
        facebook_content: formData.facebookContent || null,
        facebook_hashtags: formData.facebookHashtags || [],
        facebook_images: formData.facebookImages || [],
        create_instagram_post: formData.createInstagramPost || false,
        instagram_content: formData.instagramContent || null,
        instagram_hashtags: formData.instagramHashtags || [],
        instagram_images: formData.instagramImages || []
      };

      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();

      if (error) throw error;

      if (!isMobile) {
        toast({
          title: "Succès",
          description: "Brouillon enregistré avec succès"
        });
      }

      clearSavedData();
      
      form.reset({
        title: "",
        description: "",
        wordpressCategory: "",
        publishDate: undefined,
        status: "published",
        images: [],
        additionalMedias: [], // NEW FIELD
        seoTitle: "",
        seoDescription: "",
        seoSlug: ""
      });
      
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving draft:", error);
      if (!isMobile) {
        toast({
          title: "Erreur",
          description: "Erreur lors de l'enregistrement du brouillon: " + error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    const formData = form.getValues();
    if ((formData.status === 'published' || formData.status === 'scheduled') && !canPublish()) {
      if (!isMobile) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${stats.maxLimit} publications ce mois-ci. Votre annonce sera sauvegardée en brouillon.`,
          variant: "destructive"
        });
      }
      
      form.setValue('status', 'draft');
      formData.status = 'draft';
    }

    try {
      setIsSubmitting(true);
      setShowPublishingOverlay(true);

      clearSavedData();

      const announcementData = {
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        status: formData.status as "draft" | "published" | "scheduled",
        images: formData.images || [],
        additional_medias: formData.additionalMedias || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null,
        create_facebook_post: formData.createFacebookPost || false,
        facebook_content: formData.facebookContent || null,
        facebook_hashtags: formData.facebookHashtags || [],
        facebook_images: formData.facebookImages || [],
        create_instagram_post: formData.createInstagramPost || false,
        instagram_content: formData.instagramContent || null,
        instagram_hashtags: formData.instagramHashtags || [],
        instagram_images: formData.instagramImages || []
      };

      const {
        data: newAnnouncement,
        error
      } = await supabase.from("announcements").insert(announcementData).select().single();
      if (error) throw error;

      if ((formData.status === 'published' || formData.status === 'scheduled') && canPublish()) {
        await incrementPublicationCount();
      }

      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      
      // WordPress publishing with additional medias
      if ((formData.status === 'published' || formData.status === 'scheduled') && formData.wordpressCategory && user?.id) {
        // Créer un objet announcement avec les médias additionnels
        const announcementWithMedias = {
          ...newAnnouncement,
          additionalMedias: formData.additionalMedias || []
        } as Announcement;
        
        wordpressResult = await publishToWordPress(announcementWithMedias, formData.wordpressCategory, user.id);
        
        if (!isMobile) {
          if (wordpressResult.success) {
            toast({
              title: "Succès",
              description: "Annonce publiée avec succès"
            });
          } else {
            toast({
              title: "Attention",
              description: "Annonce enregistrée, mais la publication WordPress a échoué",
              variant: "destructive"
            });
          }
        }
      } else {
        if (!isMobile) {
          toast({
            title: "Succès",
            description: "Annonce enregistrée avec succès"
          });
        }
      }

      form.reset({
        title: "",
        description: "",
        wordpressCategory: "",
        publishDate: undefined,
        status: "published",
        images: [],
        additionalMedias: [], // NEW FIELD
        seoTitle: "",
        seoDescription: "",
        seoSlug: ""
      });

      setTimeout(() => {
        setShowPublishingOverlay(false);
        resetPublishingState();
        navigate("/announcements", { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      if (!isMobile) {
        toast({
          title: "Erreur",
          description: "Erreur lors de l'enregistrement: " + error.message,
          variant: "destructive"
        });
      }
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
      if (!isMobile) {
        toast({
          title: "Champ requis",
          description: "Veuillez sélectionner une catégorie avant de continuer.",
          variant: "destructive"
        });
      }
      return;
    }
    if (currentStepIndex === 1 && !form.getValues().title) {
      if (!isMobile) {
        toast({
          title: "Champ requis",
          description: "Veuillez saisir un titre avant de continuer.",
          variant: "destructive"
        });
      }
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
    <>
      {isMobile ? (
        <div className="min-h-screen bg-white">
          <CreateAnnouncementHeader 
            currentStep={currentStepIndex} 
            totalSteps={stepConfigs.length} 
            onSaveDraft={saveAnnouncementDraft}
            isSavingDraft={isSavingDraft}
          />

          {!canPublish() && (
            <div className="pt-16 px-4">
              <div className="max-w-3xl mx-auto mb-4">
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-orange-800 text-lg">Limite mensuelle atteinte</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-orange-700 mb-2">
                      Vous avez publié {stats.publishedCount}/{stats.maxLimit} annonces ce mois-ci.
                    </p>
                    <p className="text-orange-600 text-sm">
                      Vos nouvelles annonces seront automatiquement sauvegardées en brouillon. 
                      Nouveau quota disponible le mois prochain !
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        
          <div className="pt-16 pb-24 px-4">
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit(handleSubmit)(e);
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
                className="h-full"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="my-8 text-center">{/* pas de px-4 car déjà sur le parent */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStep.title}</h2>
                    <p className="text-gray-600 text-base max-w-2xl mx-auto">{currentStep.description}</p>
                  </div>
                  
                  <div className="overflow-hidden">
                    <div>
                      {currentStep.id === "category" && <CategoryStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "description" && <DescriptionStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "images" && <ImagesStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "social" && <SocialStep form={form} onSkip={handleNext} />}
                      
                      {currentStep.id === "publishing" && <PublishingStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "summary" && <AnnouncementSummary data={form.getValues()} isMobile={isMobile} categoryName={getCategoryName()} />}
                    </div>
                  </div>
                </div>
                
                <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg`}>
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
                    className="bg-transparent border-none max-w-4xl mx-auto" 
                  />
                </div>
              </form>
            </Form>
          </div>
        </div>
      ) : (
        <DynamicBackground className="min-h-screen">

          <CreateAnnouncementHeader 
            currentStep={currentStepIndex} 
            totalSteps={stepConfigs.length} 
            onSaveDraft={saveAnnouncementDraft}
            isSavingDraft={isSavingDraft}
          />

          {!canPublish() && (
            <div className="pt-16 px-4">
              <div className="max-w-3xl mx-auto mb-4">
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-orange-800 text-lg">Limite mensuelle atteinte</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-orange-700 mb-2">
                      Vous avez publié {stats.publishedCount}/{stats.maxLimit} annonces ce mois-ci.
                    </p>
                    <p className="text-orange-600 text-sm">
                      Vos nouvelles annonces seront automatiquement sauvegardées en brouillon. 
                      Nouveau quota disponible le mois prochain !
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        
          <div className="pt-16 pb-20 px-4 md:max-w-4xl md:mx-auto">
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit(handleSubmit)(e);
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
                className="h-full"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="my-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStep.title}</h2>
                    <p className="text-gray-600 text-base max-w-2xl mx-auto">{currentStep.description}</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8">
                      {currentStep.id === "category" && <CategoryStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "description" && <DescriptionStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "images" && <ImagesStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "social" && <SocialStep form={form} onSkip={handleNext} />}
                      
                      {currentStep.id === "publishing" && <PublishingStep form={form} isMobile={isMobile} />}
                      
                      {currentStep.id === "summary" && <AnnouncementSummary data={form.getValues()} isMobile={isMobile} categoryName={getCategoryName()} />}
                    </div>
                  </div>
                </div>
                
                <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg`}>
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
                    className="bg-transparent border-none max-w-4xl mx-auto" 
                  />
                </div>
              </form>
            </Form>
          </div>
        </DynamicBackground>
      )}
      
      
      <PublishingLoadingOverlay 
        isOpen={showPublishingOverlay} 
        steps={publishingSteps} 
        currentStepId={publishingState.currentStep} 
        progress={publishingState.progress} 
      />
    </>
  );
};

export default CreateAnnouncement;
