
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

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
  isMobile
}: StepNavigationProps) => {
  return (
    <div className={`flex justify-between ${isMobile ? "border-t border-border pt-4 pb-4 px-4 sticky bottom-0 bg-background" : "mt-6"}`}>
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
