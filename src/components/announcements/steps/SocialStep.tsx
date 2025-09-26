import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Zap } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { useAuth } from "@/context/AuthContext";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import SocialMediaImageSelector from "../SocialMediaImageSelector";
import EditableSocialPreview from "../EditableSocialPreview";

interface SocialStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  onSkip: () => void;
  className?: string;
}

export default function SocialStep({ form, onSkip, className }: SocialStepProps) {
  const { user } = useAuth();
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const [socialContent, setSocialContent] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hasZapierWebhook, setHasZapierWebhook] = useState(false);

  // Vérifier si l'utilisateur a configuré Zapier
  useEffect(() => {
    const checkZapierConfig = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('zapier_webhook_url')
          .eq('id', user.id)
          .single();
        
        setHasZapierWebhook(!!profile?.zapier_webhook_url);
      }
    };
    
    checkZapierConfig();
  }, [user]);

  const watchedValues = form.watch();
  const { title, description } = watchedValues;

  const handleGenerateContent = async () => {
    if (!title) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord saisir un titre dans l'étape précédente",
        variant: "destructive",
      });
      return;
    }

    try {
      const optimizedContent = await optimizeContent(
        "generateSocialContent",
        title,
        description || "",
        {
          tone: "engaging",
          length: "short"
        }
      );

      if (optimizedContent) {
        setSocialContent(optimizedContent);
        toast({
          title: "Contenu généré",
          description: "Le contenu pour les réseaux sociaux a été généré avec succès",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu",
        variant: "destructive",
      });
    }
  };

  if (!hasZapierWebhook) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Configuration Zapier requise</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              La publication sur les réseaux sociaux nécessite une configuration Zapier par votre administrateur.
            </p>
            <p className="text-sm text-muted-foreground">
              Contactez votre administrateur pour configurer l'intégration Zapier et pouvoir publier automatiquement sur Facebook, Instagram, LinkedIn, etc.
            </p>
            <Button onClick={onSkip} variant="outline" className="w-full">
              Passer cette étape
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const watchedValuesForImages = form.watch();
  const { images = [], additionalMedias = [] } = watchedValuesForImages;
  const allImages = [...images, ...additionalMedias];
  const selectedImages = allImages.map(url => ({ url }));

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Contenu pour les réseaux sociaux
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Notre IA va transformer votre description en contenu optimisé pour les réseaux sociaux avec emojis et mise en forme
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone d'explication avant génération */}
          {!socialContent && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">✨ Génération automatique par IA</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    À partir de votre description, notre IA va créer un contenu engageant avec :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Emojis appropriés
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Structure engageante
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Call-to-action
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Ton professionnel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nouveau composant de preview éditable */}
          <EditableSocialPreview
            form={form}
            socialContent={socialContent}
            setSocialContent={setSocialContent}
            hashtags={hashtags}
            setHashtags={setHashtags}
            selectedImages={selectedImages}
            onGenerateContent={handleGenerateContent}
            isGenerating={isOptimizing.generateSocialContent}
          />

          <Separator />

          {/* Section des images */}
          <SocialMediaImageSelector form={form} />

          <Separator />

          {/* Planification optionnelle */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Programmer la publication (optionnel)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de publication</label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure de publication</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
            </div>
            
            {(publishDate || publishTime) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📅 Publication programmée pour : {publishDate ? new Date(publishDate).toLocaleDateString("fr-FR") : "Aucune date"} 
                  {publishTime ? ` à ${publishTime}` : ""}
                </p>
              </div>
            )}
          </div>

          {/* Bouton pour passer l'étape */}
          <div className="flex justify-center pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              className="text-center"
            >
              Passer cette étape
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}