
import React, { useState, useEffect } from "react";
import { useAnnouncementForm } from "@/hooks/useAnnouncementForm";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PublishingProvider, usePublishing } from "@/context/PublishingContext";
import PublishingLoadingOverlay from "@/components/announcements/PublishingLoadingOverlay";
import CategoryStep from "@/components/announcements/steps/CategoryStep";
import DescriptionStep from "@/components/announcements/steps/DescriptionStep";
import ImagesStep from "@/components/announcements/steps/ImagesStep";
import SeoStep from "@/components/announcements/steps/SeoStep";
import PublishingStep from "@/components/announcements/steps/PublishingStep";
import StepNavigation from "@/components/announcements/steps/StepNavigation";
import AnnouncementSummary from "@/components/announcements/steps/AnnouncementSummary";
import { Form } from "@/components/ui/form";
import { StepConfig } from "@/types/steps";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import CreateAnnouncementHeader from "@/components/announcements/steps/CreateAnnouncementHeader";
import { toast } from "@/hooks/use-toast";

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

const AnnouncementForm = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { categories } = useWordPressCategories();
  const { 
    showOverlay, 
    setShowOverlay, 
    formStep, 
    setFormStep 
  } = usePublishing();
  
  const {
    form,
    isSubmitting,
    isSavingDraft,
    saveAnnouncementDraft,
    handleSubmit,
    saveData
  } = useAnnouncementForm(() => setShowOverlay(true));

  useEffect(() => {
    // Sauvegarder l'étape actuelle dans le formulaire pour la persistance
    const currentValues = form.getValues();
    form.setValue("_currentStep", formStep);
    saveData();
  }, [formStep, form, saveData]);

  // Récupérer l'étape sauvegardée au chargement du formulaire
  useEffect(() => {
    const savedStep = form.getValues()._currentStep;
    if (savedStep !== undefined) {
      setFormStep(savedStep);
    }
  }, [form, setFormStep]);

  const activeStep = stepConfigs[formStep];

  const handlePrevious = () => {
    if (formStep > 0) {
      setFormStep(formStep - 1);
    }
  };

  const handleNext = () => {
    if (formStep === 0 && !form.getValues().wordpressCategory) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner une catégorie avant de continuer.",
        variant: "destructive"
      });
      return;
    }
    if (formStep === 1 && !form.getValues().title) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un titre avant de continuer.",
        variant: "destructive"
      });
      return;
    }
    if (formStep < stepConfigs.length - 1) {
      setFormStep(formStep + 1);
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
      <CreateAnnouncementHeader 
        currentStep={formStep} 
        totalSteps={stepConfigs.length} 
        onSaveDraft={saveAnnouncementDraft}
        isSavingDraft={isSavingDraft}
      />
    
      <div className="pt-16 pb-20 px-4 md:max-w-3xl md:mx-auto">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="h-full">
            <div className="max-w-3xl mx-auto">
              <div className="my-6">
                <h2 className="text-xl font-semibold mb-1">{activeStep.title}</h2>
                <p className="text-muted-foreground text-sm">{activeStep.description}</p>
              </div>
              
              {activeStep.id === "category" && <CategoryStep form={form} isMobile={isMobile} />}
              {activeStep.id === "description" && <DescriptionStep form={form} isMobile={isMobile} />}
              {activeStep.id === "images" && <ImagesStep form={form} isMobile={isMobile} />}
              {activeStep.id === "seo" && <SeoStep form={form} isMobile={isMobile} />}
              {activeStep.id === "publishing" && <PublishingStep form={form} isMobile={isMobile} />}
              {activeStep.id === "summary" && (
                <AnnouncementSummary 
                  data={form.getValues()} 
                  isMobile={isMobile} 
                  categoryName={getCategoryName()} 
                />
              )}
            </div>
            
            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-background border-t`}>
              <StepNavigation 
                currentStep={formStep} 
                totalSteps={stepConfigs.length} 
                onPrevious={handlePrevious} 
                onNext={handleNext} 
                onSubmit={() => handleSubmit(form.getValues())}
                onSaveDraft={saveAnnouncementDraft}
                isLastStep={formStep === stepConfigs.length - 1} 
                isFirstStep={formStep === 0} 
                isSubmitting={isSubmitting} 
                isMobile={isMobile} 
                className="bg-transparent border-none max-w-3xl mx-auto" 
              />
            </div>
          </form>
        </Form>
      </div>
      
      <PublishingLoadingOverlay 
        isOpen={showOverlay}
        steps={[
          {
            id: "prepare",
            label: "Préparation de la publication",
            status: "idle",
            icon: <div className="h-5 w-5 text-muted-foreground"></div>
          },
          {
            id: "image",
            label: "Téléversement de l'image principale",
            status: "idle",
            icon: <div className="h-5 w-5 text-muted-foreground"></div>
          },
          {
            id: "wordpress",
            label: "Publication sur WordPress",
            status: "idle",
            icon: <div className="h-5 w-5 text-muted-foreground"></div>
          },
          {
            id: "database",
            label: "Mise à jour de la base de données",
            status: "idle",
            icon: <div className="h-5 w-5 text-muted-foreground"></div>
          }
        ]}
        currentStepId="prepare" 
        progress={0} 
      />
    </div>
  );
};

const CreateAnnouncement = () => (
  <PublishingProvider>
    <AnnouncementForm />
  </PublishingProvider>
);

export default CreateAnnouncement;
