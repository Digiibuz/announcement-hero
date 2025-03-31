
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, FileImage, Server, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PublishingStep {
  id: string;
  label: string;
  status: "idle" | "loading" | "success" | "error";
  icon: React.ReactNode;
}

interface PublishingLoadingOverlayProps {
  isOpen: boolean;
  steps: PublishingStep[];
  currentStepId: string | null;
  progress: number;
  onClose?: () => void;
}

const PublishingLoadingOverlay: React.FC<PublishingLoadingOverlayProps> = ({
  isOpen,
  steps,
  currentStepId,
  progress,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-foreground/10">
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
              alt="Logo" 
              className="h-16 mb-4"
            />
            <h2 className="text-2xl font-bold text-center">Publication en cours</h2>
            <p className="text-muted-foreground text-center mt-2">
              Veuillez patienter pendant que nous publions votre annonce
            </p>
          </div>

          <Progress value={progress} className="h-2 mb-6" />

          <div className="space-y-4">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center p-3 rounded-md border transition-colors",
                  currentStepId === step.id 
                    ? "border-primary bg-primary/5"
                    : "border-border",
                  step.status === "success" && "border-green-500 bg-green-500/5",
                  step.status === "error" && "border-destructive bg-destructive/5"
                )}
              >
                <div className="flex-shrink-0 mr-3">
                  {step.status === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : step.status === "success" ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : step.status === "error" ? (
                    <X className="h-5 w-5 text-destructive" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-grow">
                  <p className={cn(
                    "font-medium",
                    step.status === "success" && "text-green-500",
                    step.status === "error" && "text-destructive"
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingLoadingOverlay;
