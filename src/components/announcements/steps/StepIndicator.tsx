
import React from "react";
import { Check, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  isMobile?: boolean;
}

const StepIndicator = ({ steps, currentStep, isMobile }: StepIndicatorProps) => {
  return (
    <div className={`mb-8 ${isMobile ? "px-4" : ""}`}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border transition-all",
                  index === currentStep 
                    ? "bg-primary text-primary-foreground border-primary"
                    : index < currentStep
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-muted border-border text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 text-center max-w-[80px]",
                index === currentStep ? "font-medium text-foreground" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-grow h-[1px] mx-2",
                index < currentStep ? "bg-primary/50" : "bg-border"
              )}>
                <span className="sr-only">Séparateur</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
