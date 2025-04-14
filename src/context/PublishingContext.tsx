
import React, { createContext, useContext, useState } from "react";
import { PublishingStep } from "@/components/announcements/PublishingLoadingOverlay";

interface PublishingState {
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  publishingSteps: PublishingStep[];
  currentStep: string;
  progress: number;
}

const PublishingContext = createContext<PublishingState | undefined>(undefined);

export const PublishingProvider = ({ children }: { children: React.ReactNode }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentStep] = useState("prepare");
  const [progress] = useState(0);

  const publishingSteps: PublishingStep[] = [
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
  ];

  return (
    <PublishingContext.Provider value={{
      showOverlay,
      setShowOverlay,
      publishingSteps,
      currentStep,
      progress
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
