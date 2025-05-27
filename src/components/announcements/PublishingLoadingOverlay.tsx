
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

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
}

const PublishingLoadingOverlay = ({
  isOpen,
  steps,
  currentStepId,
  progress
}: PublishingLoadingOverlayProps) => {
  if (!isOpen) return null;

  const getStepIcon = (step: PublishingStep) => {
    switch (step.status) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepTextColor = (step: PublishingStep) => {
    switch (step.status) {
      case "loading":
        return "text-blue-700 font-medium";
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-lg">Publication en cours</CardTitle>
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-muted-foreground">
            {progress}% terminé
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.id === currentStepId
                    ? "bg-blue-50 border border-blue-200"
                    : step.status === "success"
                    ? "bg-green-50"
                    : step.status === "error"
                    ? "bg-red-50"
                    : "bg-gray-50"
                }`}
              >
                {getStepIcon(step)}
                <span className={`flex-1 ${getStepTextColor(step)}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Veuillez patienter pendant la publication...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingLoadingOverlay;
