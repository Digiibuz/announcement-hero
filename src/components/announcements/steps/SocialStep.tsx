import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Facebook as FacebookIcon, Instagram as InstagramIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFacebookConnection } from "@/hooks/useFacebookConnection";
import { SocialPlatformSelector } from "./SocialPlatformSelector";
import { FacebookTab } from "./social/FacebookTab";
import { InstagramTab } from "./social/InstagramTab";
import { AnnouncementFormData } from "../AnnouncementForm";

interface SocialStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  onSkip: () => void;
  className?: string;
}

export default function SocialStep({ form, onSkip, className }: SocialStepProps) {
  const navigate = useNavigate();
  const { hasActiveConnection } = useFacebookConnection();
  const [showPlatformQuestion, setShowPlatformQuestion] = useState(true);
  
  const facebookEnabled = form.watch("createFacebookPost") || false;
  const instagramEnabled = form.watch("createInstagramPost") || false;

  const handlePlatformSelection = (skipAll: boolean = false) => {
    setShowPlatformQuestion(false);
    if (skipAll && onSkip) {
      onSkip();
    }
  };

  // Question initiale pour la sélection des plateformes
  if (showPlatformQuestion) {
    return (
      <div className={className}>
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Publication sur les réseaux sociaux</h2>
              <p className="text-muted-foreground">
                Sur quelles plateformes souhaitez-vous publier ?
              </p>
            </div>

            <SocialPlatformSelector
              facebookEnabled={facebookEnabled}
              instagramEnabled={instagramEnabled}
              onFacebookChange={(enabled) => form.setValue("createFacebookPost", enabled)}
              onInstagramChange={(enabled) => form.setValue("createInstagramPost", enabled)}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                type="button"
                onClick={() => handlePlatformSelection(false)}
                size="lg"
                disabled={!facebookEnabled && !instagramEnabled}
              >
                Continuer
              </Button>
              <Button
                type="button"
                onClick={() => handlePlatformSelection(true)}
                variant="outline"
                size="lg"
              >
                Passer cette étape
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
      {/* Alerte de connexion Facebook */}
      {!hasActiveConnection && (
        <Alert className="mb-6 mx-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Connectez votre page Facebook pour publier vos annonces automatiquement.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
            >
              <FacebookIcon className="mr-2 h-4 w-4" />
              Connecter Facebook
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="px-4 pb-4 space-y-2">
        <h2 className="text-2xl font-bold">Réseaux sociaux</h2>
        <p className="text-muted-foreground">
          Adaptez votre contenu pour les réseaux sociaux et programmez votre publication.
        </p>
      </div>

      {/* Onglets - pleine largeur */}
      <Tabs defaultValue={facebookEnabled ? "facebook" : "instagram"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          {facebookEnabled && (
            <TabsTrigger value="facebook" className="gap-2">
              <FacebookIcon className="h-4 w-4" />
              Facebook
            </TabsTrigger>
          )}
          {instagramEnabled && (
            <TabsTrigger value="instagram" className="gap-2">
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

      {/* Bouton passer - avec padding */}
      <div className="flex justify-center pt-6 px-4 pb-8">
        <Button
          type="button"
          onClick={onSkip}
          variant="outline"
        >
          Passer cette étape
        </Button>
      </div>
    </div>
  );
}
