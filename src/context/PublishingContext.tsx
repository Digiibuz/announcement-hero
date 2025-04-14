
import React, { createContext, useContext, useState, useEffect } from "react";
import { PublishingStep } from "@/components/announcements/PublishingLoadingOverlay";

interface PublishingState {
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  publishingSteps: PublishingStep[];
  currentStep: string;
  progress: number;
  updateProgress: (step: string, status: "idle" | "loading" | "success" | "error", newProgress: number) => void;
  formStep: number;
  setFormStep: (step: number) => void;
}

const PublishingContext = createContext<PublishingState | undefined>(undefined);

export const PublishingProvider = ({ children }: { children: React.ReactNode }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentStep, setCurrentStep] = useState("prepare");
  const [progress, setProgress] = useState(0);
  const [formStep, setFormStep] = useState(() => {
    const savedStep = localStorage.getItem("current-announcement-step");
    return savedStep ? parseInt(savedStep, 10) : 0;
  });
  const [publishingSteps, setPublishingSteps] = useState<PublishingStep[]>([
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
  ]);

  // Sauvegarder l'étape courante lorsqu'elle change
  useEffect(() => {
    localStorage.setItem("current-announcement-step", formStep.toString());
  }, [formStep]);

  const updateProgress = (step: string, status: "idle" | "loading" | "success" | "error", newProgress: number) => {
    setCurrentStep(step);
    setProgress(newProgress);
    setPublishingSteps(steps => steps.map(s => 
      s.id === step 
        ? { ...s, status } 
        : s
    ));
  };

  return (
    <PublishingContext.Provider value={{
      showOverlay,
      setShowOverlay,
      publishingSteps,
      currentStep,
      progress,
      updateProgress,
      formStep,
      setFormStep
    }}>
      {children}
    </PublishingContext.Provider>
  );
};

export const usePublishing = () => {
  const context = useContext(PublishingContext);
  if (context === undefined) {
    throw new Error("usePublishing must be used within a PublishingProvider");
  }
  return context;
};
