import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Hash, Sparkles, Image as ImageIcon, Share2, Zap, Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
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
                  <Sparkles className="h-4 w-4 text-white" />
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Texte de publication</label>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleGenerateContent}
                disabled={isOptimizing.generateDescription}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                {isOptimizing.generateDescription ? "Génération en cours..." : "🚀 Générer avec l'IA"}
              </Button>
            </div>
            <Textarea
              value={socialContent}
              onChange={(e) => setSocialContent(e.target.value)}
              placeholder="Le contenu optimisé pour les réseaux sociaux apparaîtra ici après génération IA..."
              className="min-h-[120px]"
            />
            {socialContent && (
              <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                <Sparkles className="h-3 w-3" />
                Contenu généré par IA - Vous pouvez le modifier si nécessaire
              </div>
            )}
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

      {/* Prévisualisation Facebook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prévisualisation Facebook</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Container Facebook avec fond gris */}
          <div className="bg-gray-100 p-4 rounded-lg">
            {/* Post Facebook */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header du post */}
              <div className="p-4 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                
                {/* Nom et timestamp */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    Votre Entreprise
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {publishDate && publishTime ? (
                      <>
                        {new Date(`${publishDate}T${publishTime}`).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })} à {publishTime}
                      </>
                    ) : (
                      "Maintenant"
                    )}
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 3.314-2.686 6-6 6s-6-2.686-6-6a5.977 5.977 0 01.332-2.027z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Menu 3 points */}
                <MoreHorizontal className="w-5 h-5 text-gray-500 cursor-pointer" />
              </div>
              
              {/* Contenu du post */}
              <div className="px-4 pb-3">
                <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {getSocialMediaPreview() || "Votre contenu apparaîtra ici..."}
                </div>
              </div>
              
              {/* Images */}
              {images && images.length > 0 && (
                <div className="relative">
                  {images.length === 1 ? (
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={images[0]}
                        alt="Publication"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`grid gap-1 ${
                      images.length === 2 ? 'grid-cols-2' : 
                      images.length === 3 ? 'grid-cols-2' : 
                      'grid-cols-2'
                    }`}>
                      {images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 relative">
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">
                                +{images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-white fill-current" />
                      </div>
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-white fill-current" />
                      </div>
                    </div>
                    <span>12</span>
                  </div>
                  <div className="flex gap-3">
                    <span>3 commentaires</span>
                    <span>2 partages</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-2">
                <div className="grid grid-cols-3 gap-1">
                  <button className="flex items-center justify-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                    <Heart className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">J'aime</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Commenter</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                    <Share className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Partager</span>
                  </button>
                </div>
              </div>
            </div>
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