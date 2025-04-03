
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  isSubmitting: boolean;
  isMobile?: boolean;
  className?: string;
}

const StepNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isLastStep,
  isFirstStep,
  isSubmitting,
  isMobile,
  className
}: StepNavigationProps) => {
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
        
        {isLastStep ? (
          <Button 
            type="button" 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-[130px] mobile-nav-button bg-brand-orange hover:bg-brand-orange/90 text-black"
          >
            {isSubmitting ? "Envoi..." : "Continuer"}
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={onNext}
            disabled={isSubmitting}
            className="w-[130px] mobile-nav-button bg-brand-orange hover:bg-brand-orange/90 text-black"
          >
            Continuer
          </Button>
        )}
      </div>
    );
  }
  
  // Interface de navigation standard pour desktop
  return (
    <div className={cn("flex justify-between mt-6", className)}>
      <div>
        {!isFirstStep && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
        )}
      </div>
      
      <div className="flex items-center">
        <div className="text-sm text-muted-foreground mr-4">
          Étape {currentStep + 1} sur {totalSteps}
        </div>
        
        {isLastStep ? (
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
                <Save className="mr-2 h-4 w-4" />
                Publier
              </>
            )}
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={onNext}
            disabled={isSubmitting}
            className="bg-brand-orange hover:bg-brand-orange/90 text-black"
          >
            Suivant
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
