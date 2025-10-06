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
  onHideNextButton?: (hide: boolean) => void;
}

export default function SocialStep({ form, onSkip, className, onNavigationVisibilityChange, onNext, onHideNextButton }: SocialStepProps) {
  const navigate = useNavigate();
  const { hasActiveConnection, connectFacebook, isConnecting } = useFacebookConnection();
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
    // Vérifier si on est sur Instagram et que les images ne sont pas prêtes
    if (activeTab === "instagram" && !(window as any).instagramImagesReady) {
      return; // Empêcher la navigation
    }

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

  // Garder la navigation toujours visible sur l'étape sociale
  React.useEffect(() => {
    if (onNavigationVisibilityChange) {
      onNavigationVisibilityChange(true);
    }
  }, [onNavigationVisibilityChange]);

  // Cacher le bouton "Suivant" pendant la sélection des plateformes
  React.useEffect(() => {
    if (onHideNextButton) {
      onHideNextButton(showPlatformQuestion);
    }
  }, [showPlatformQuestion, onHideNextButton]);

  const handlePlatformSelection = (skipAll: boolean = false) => {
    setShowPlatformQuestion(false);
    if (skipAll && onSkip) {
      onSkip();
    }
  };

  // Question initiale pour la sélection des plateformes
  if (showPlatformQuestion) {
    // Si pas de connexion Facebook active, afficher le bouton de connexion
    if (!hasActiveConnection) {
      return (
        <div className={className}>
          <Card className={isMobile ? "p-4" : "p-8"}>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>Publication sur les réseaux sociaux</h2>
                {!isMobile && (
                  <p className="text-muted-foreground">
                    Connectez votre compte Facebook pour publier sur vos réseaux sociaux
                  </p>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Pour publier automatiquement vos annonces sur Facebook et Instagram, vous devez d'abord connecter votre page Facebook.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center gap-4 py-6">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    // Sauvegarder l'index de l'étape actuelle (4 = étape sociale)
                    localStorage.setItem('facebook_return_step', '4');
                    connectFacebook();
                  }}
                  disabled={isConnecting}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2"
                >
                  <FacebookIcon className="h-5 w-5" />
                  {isConnecting ? "Connexion en cours..." : "Connecter Facebook"}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handlePlatformSelection(true)}
                >
                  Passer cette étape
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Si connexion active, afficher le sélecteur de plateformes
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
