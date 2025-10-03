
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, BookCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  isSubmitting: boolean;
  isMobile?: boolean;
  className?: string;
  hideNextButton?: boolean;
}

const StepNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  onSaveDraft,
  isLastStep,
  isFirstStep,
  isSubmitting,
  isMobile,
  className,
  hideNextButton = false
}: StepNavigationProps) => {
  // Gérer le clic sur "Suivant/Continuer" - vérifier si SocialStep a sa propre logique
  const handleNextClick = () => {
    // Si on est sur l'étape social et que SocialStep a exposé sa propre fonction
    if ((window as any).socialStepHandleNext) {
      (window as any).socialStepHandleNext();
    } else {
      onNext();
    }
  };

  if (isMobile) {
    return (
      <div className={cn("flex justify-between items-center w-full", className)}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
          className="w-[130px] mobile-nav-button back-button"
        >
          Retour
        </Button>
        
        {!hideNextButton && (
          isLastStep ? (
            <Button 
              type="button" 
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-[130px] mobile-nav-button bg-brand-orange hover:bg-brand-orange/90 text-black"
            >
              {isSubmitting ? "Envoi..." : "Publier l'annonce"}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleNextClick}
              disabled={isSubmitting}
              className="w-[130px] mobile-nav-button bg-brand-orange hover:bg-brand-orange/90 text-black"
            >
              Continuer
            </Button>
          )
        )}
      </div>
    );
  }
  
  // Interface de navigation standard pour desktop
  return (
    <div className={cn("flex justify-between mt-6", className)}>
      <div className="flex items-center">
        {!isFirstStep && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrevious}
            disabled={isSubmitting}
            className="mr-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
        )}
        
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer brouillon
          </Button>
        )}
      </div>
      
      <div className="flex items-center">
        <div className="text-sm text-muted-foreground mr-4">
          Étape {currentStep + 1} sur {totalSteps}
        </div>
        
        {!hideNextButton && (
          isLastStep ? (
            <Button 
              type="button" 
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-brand-orange hover:bg-brand-orange/90 text-black"
            >
              {isSubmitting ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <BookCheck className="mr-2 h-4 w-4" />
                  Publier l'annonce
                </>
              )}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleNextClick}
              disabled={isSubmitting}
              className="bg-brand-orange hover:bg-brand-orange/90 text-black"
            >
              Suivant
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
