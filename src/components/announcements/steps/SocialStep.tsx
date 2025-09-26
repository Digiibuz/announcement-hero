import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Hash, Sparkles, Image as ImageIcon, Share2, Zap } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { useAuth } from "@/context/AuthContext";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import SocialMediaImageSelector from "../SocialMediaImageSelector";

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
  const [newHashtag, setNewHashtag] = useState("");
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
  const { title, description, images } = watchedValues;

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
        "generateDescription",
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

  const addHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag)) {
      setHashtags([...hashtags, newHashtag.replace("#", "")]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const getSocialMediaPreview = () => {
    const previewText = socialContent || description || "";
    const displayHashtags = hashtags.map(tag => `#${tag}`).join(" ");
    return `${previewText}\n\n${displayHashtags}`.trim();
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Publication sur les réseaux sociaux
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Adaptez votre contenu pour les réseaux sociaux et programmez votre publication
          </p>
        </CardHeader>
      </Card>

      {/* Contenu social */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Contenu pour les réseaux sociaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Texte de publication</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={isOptimizing.generateDescription}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isOptimizing.generateDescription ? "Génération..." : "Générer avec l'IA"}
              </Button>
            </div>
            <Textarea
              value={socialContent}
              onChange={(e) => setSocialContent(e.target.value)}
              placeholder="Rédigez votre publication pour les réseaux sociaux..."
              className="min-h-[120px]"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Hashtags
            </label>
            <div className="flex gap-2">
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                placeholder="Ajouter un hashtag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              />
              <Button type="button" onClick={addHashtag} size="sm">
                Ajouter
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeHashtag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images sélectionnées avec drag & drop */}
      <SocialMediaImageSelector form={form} />

      {/* Programmation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de publication</label>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Heure de publication
              </label>
              <Input
                type="time"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prévisualisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prévisualisation de la publication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="font-medium text-sm">Aperçu du post</div>
            <div className="whitespace-pre-wrap text-sm">
              {getSocialMediaPreview() || "Votre contenu apparaîtra ici..."}
            </div>
            {images && images.length > 0 && (
              <div className="text-xs text-muted-foreground">
                📸 {images.length} image{images.length > 1 ? "s" : ""} attachée{images.length > 1 ? "s" : ""}
              </div>
            )}
            {publishDate && publishTime && (
              <div className="text-xs text-muted-foreground">
                📅 Programmé pour le {new Date(`${publishDate}T${publishTime}`).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bouton passer l'étape */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="gap-2"
        >
          Passer cette étape
        </Button>
      </div>
    </div>
  );
}