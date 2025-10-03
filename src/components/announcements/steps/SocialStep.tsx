import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Facebook as FacebookIcon, Instagram as InstagramIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFacebookConnection } from "@/hooks/useFacebookConnection";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SocialPlatformSelector } from "./SocialPlatformSelector";
import { FacebookTab } from "./social/FacebookTab";
import { InstagramTab } from "./social/InstagramTab";
import { AnnouncementFormData } from "../AnnouncementForm";

interface SocialStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  onSkip: () => void;
  className?: string;
  onNavigationVisibilityChange?: (visible: boolean) => void;
  onNext?: () => void;
}

export default function SocialStep({ form, onSkip, className, onNavigationVisibilityChange, onNext }: SocialStepProps) {
  const navigate = useNavigate();
  const { hasActiveConnection } = useFacebookConnection();
  const [showPlatformQuestion, setShowPlatformQuestion] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const isMobile = useMediaQuery("(max-width: 767px)");
  
  const facebookEnabled = form.watch("createFacebookPost") || false;
  const instagramEnabled = form.watch("createInstagramPost") || false;

  // Initialiser l'onglet actif
  React.useEffect(() => {
    if (!activeTab && !showPlatformQuestion) {
      setActiveTab(facebookEnabled ? "facebook" : "instagram");
    }
  }, [facebookEnabled, instagramEnabled, showPlatformQuestion, activeTab]);

  // Gérer le passage à l'étape suivante ou changement d'onglet
  const handleNextClick = () => {
    if (facebookEnabled && instagramEnabled && activeTab === "facebook") {
      // Si les deux plateformes sont activées et on est sur Facebook, basculer vers Instagram
      setActiveTab("instagram");
    } else {
      // Sinon, passer à l'étape suivante
      if (onNext) {
        onNext();
      }
    }
  };

  // Exposer la fonction handleNextClick via un effet pour que le parent puisse l'appeler
  React.useEffect(() => {
    if (onNavigationVisibilityChange) {
      (window as any).socialStepHandleNext = handleNextClick;
    }
    return () => {
      delete (window as any).socialStepHandleNext;
    };
  }, [activeTab, facebookEnabled, instagramEnabled, onNext, onNavigationVisibilityChange]);

  // Garder la navigation visible, mais masquer uniquement lors de la sélection initiale
  React.useEffect(() => {
    if (onNavigationVisibilityChange) {
      // Navigation cachée seulement pendant la question de sélection des plateformes
      onNavigationVisibilityChange(!showPlatformQuestion);
    }
  }, [showPlatformQuestion, onNavigationVisibilityChange]);

  const handlePlatformSelection = (skipAll: boolean = false) => {
    setShowPlatformQuestion(false);
    // Réafficher explicitement la navigation
    if (onNavigationVisibilityChange) {
      onNavigationVisibilityChange(true);
    }
    if (skipAll && onSkip) {
      onSkip();
    }
  };

  // Question initiale pour la sélection des plateformes
  if (showPlatformQuestion) {
    return (
      <div className={className}>
        <Card className={isMobile ? "p-4" : "p-8"}>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>Publication sur les réseaux sociaux</h2>
              {!isMobile && (
                <p className="text-muted-foreground">
                  Sur quelles plateformes souhaitez-vous publier ?
                </p>
              )}
            </div>

            <SocialPlatformSelector
              facebookEnabled={facebookEnabled}
              instagramEnabled={instagramEnabled}
              onFacebookChange={(enabled) => form.setValue("createFacebookPost", enabled)}
              onInstagramChange={(enabled) => form.setValue("createInstagramPost", enabled)}
              isMobile={isMobile}
            />

            <div className="flex justify-center gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePlatformSelection(true)}
                size="lg"
              >
                Passer cette étape
              </Button>
              <Button
                type="button"
                onClick={() => handlePlatformSelection(false)}
                size="lg"
                disabled={!facebookEnabled && !instagramEnabled}
                className="bg-brand-orange hover:bg-brand-orange/90 text-black"
              >
                Continuer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Vue principale avec onglets
  return (
    <div className={className}>
      {/* Onglets - pleine largeur */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none bg-background">
          {facebookEnabled && (
            <TabsTrigger 
              value="facebook" 
              className="gap-2 data-[state=active]:bg-[#1877F2] data-[state=active]:text-white"
            >
              <FacebookIcon className="h-4 w-4" />
              Facebook
            </TabsTrigger>
          )}
          {instagramEnabled && (
            <TabsTrigger 
              value="instagram" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E4405F] data-[state=active]:via-[#C13584] data-[state=active]:to-[#833AB4] data-[state=active]:text-white"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </TabsTrigger>
          )}
        </TabsList>

        {facebookEnabled && (
          <TabsContent value="facebook" className="mt-0">
            <FacebookTab form={form} />
          </TabsContent>
        )}

        {instagramEnabled && (
          <TabsContent value="instagram" className="mt-0">
            <InstagramTab form={form} />
          </TabsContent>
        )}
      </Tabs>

    </div>
  );
}
