import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Hash, Sparkles, Image as ImageIcon, Share2, Zap, Heart, MessageCircle, Share, MoreHorizontal, PenTool } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { useAuth } from "@/context/AuthContext";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import SocialMediaImageSelector from "../SocialMediaImageSelector";
import SocialContentWriterModal from "../SocialContentWriterModal";

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
  const [showFacebookQuestion, setShowFacebookQuestion] = useState(true);
  const [isWriterModalOpen, setIsWriterModalOpen] = useState(false);

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
  const { title, description, images = [], additionalMedias = [], createFacebookPost } = watchedValues;
  
  // Combiner toutes les images disponibles
  const allImages = [...images, ...additionalMedias].filter(Boolean);

  // Vérifier si l'utilisateur a déjà fait un choix pour la création de post Facebook
  useEffect(() => {
    // Si createFacebookPost est false (l'utilisateur avait dit "non"), 
    // mais qu'il revient sur cette étape, on repose la question
    if (createFacebookPost === false) {
      form.setValue('createFacebookPost', undefined);
      setShowFacebookQuestion(true);
    } else if (createFacebookPost !== undefined) {
      setShowFacebookQuestion(false);
    }
    
    // Initialiser les valeurs depuis le formulaire s'il y en a
    if (watchedValues.socialContent) {
      setSocialContent(watchedValues.socialContent);
    }
    if (watchedValues.socialHashtags) {
      setHashtags(watchedValues.socialHashtags);
    }
  }, [createFacebookPost, watchedValues.socialContent, watchedValues.socialHashtags]);

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
        // Sauvegarder automatiquement dans le formulaire
        form.setValue('socialContent', optimizedContent);
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

  const handleWriterModalSave = (content: string, modalHashtags: string[]) => {
    setSocialContent(content);
    setHashtags(modalHashtags);
    form.setValue('socialContent', content);
    form.setValue('socialHashtags', modalHashtags);
    toast({
      title: "Contenu enregistré",
      description: "Votre post personnalisé a été enregistré avec succès",
    });
  };

  const addHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag)) {
      const updatedHashtags = [...hashtags, newHashtag.replace("#", "")];
      setHashtags(updatedHashtags);
      // Sauvegarder automatiquement dans le formulaire
      form.setValue('socialHashtags', updatedHashtags);
      setNewHashtag("");
    }
  };

  const removeHashtag = (tag: string) => {
    const updatedHashtags = hashtags.filter(h => h !== tag);
    setHashtags(updatedHashtags);
    // Sauvegarder automatiquement dans le formulaire
    form.setValue('socialHashtags', updatedHashtags);
  };

  const handleCreateFacebookPost = (choice: boolean) => {
    form.setValue('createFacebookPost', choice);
    if (choice) {
      // Sauvegarder les hashtags et contenu social dans le formulaire
      form.setValue('socialContent', socialContent);
      form.setValue('socialHashtags', hashtags);
      setShowFacebookQuestion(false);
    } else {
      // Si l'utilisateur choisit "Non", passer directement à l'étape suivante
      onSkip();
    }
  };

  const getSocialMediaPreview = () => {
    const previewText = socialContent || description || "";
    const displayHashtags = hashtags.map(tag => `#${tag}`).join(" ");
    return `${previewText}\n\n${displayHashtags}`.trim();
  };


  
  // Afficher la question initiale si l'utilisateur n'a pas encore fait de choix
  if (showFacebookQuestion && createFacebookPost === undefined) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Publication sur les réseaux sociaux</CardTitle>
            <p className="text-muted-foreground mt-2">
              Souhaitez-vous créer un post Facebook pour cette annonce ?
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">✨ Avec un post Facebook, vous obtiendrez :</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Contenu optimisé généré par IA
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Prévisualisation Facebook en temps réel
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Gestion des hashtags et programmation
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Publication automatique via Zapier
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => handleCreateFacebookPost(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Oui, créer un post Facebook
              </Button>
              <Button 
                onClick={() => handleCreateFacebookPost(false)}
                variant="outline"
                size="lg"
              >
                Non, passer cette étape
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {/* Choix du mode de rédaction */}
          {!socialContent && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  Comment souhaitez-vous créer le contenu de votre post ?
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bouton Rédiger moi-même */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50" onClick={() => setIsWriterModalOpen(true)}>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PenTool className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Rédiger mon post moi-même</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Rédigez votre contenu personnalisé avec vos propres mots et style
                      </p>
                      <Button variant="outline" className="w-full">
                        <PenTool className="h-4 w-4 mr-2" />
                        Commencer à rédiger
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Bouton Générer avec l'IA */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50" onClick={handleGenerateContent}>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Générer avec l'IA</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Notre IA crée un contenu optimisé avec emojis et structure engageante
                      </p>
                      <Button 
                        variant="default" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isOptimizing.generateSocialContent}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isOptimizing.generateSocialContent ? "Génération..." : "Générer maintenant"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Avantages de l'IA */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">✨ Avantages de la génération IA</h4>
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
            </div>
          )}

          {/* Affichage du contenu une fois créé */}
          {socialContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Texte de publication</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={isOptimizing.generateSocialContent}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isOptimizing.generateSocialContent ? "Génération..." : "Régénérer IA"}
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => setIsWriterModalOpen(true)}>
                <div className="whitespace-pre-wrap text-sm">{socialContent}</div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <PenTool className="h-3 w-3" />
                  Cliquez pour modifier le texte
                </div>
              </div>
              
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Contenu créé - Vous pouvez le modifier à tout moment
              </div>
            </div>
          )}

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
                <div className="w-5 h-5 text-gray-500 cursor-default">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
              </div>
              
              {/* Contenu du post */}
              <div className="px-4 pb-3">
                <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {getSocialMediaPreview() || "Votre contenu apparaîtra ici..."}
                </div>
              </div>
              
              {/* Images */}
              {allImages && allImages.length > 0 && (
                <div className="relative">
                  {allImages.length === 1 ? (
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={allImages[0]}
                        alt="Publication"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`grid gap-1 ${
                      allImages.length === 2 ? 'grid-cols-2' : 
                      allImages.length === 3 ? 'grid-cols-2' : 
                      'grid-cols-2'
                    }`}>
                      {allImages.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 relative">
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 3 && allImages.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">
                                +{allImages.length - 4}
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
                  <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-700">J'aime</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-700">Commenter</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                    <Share className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-700">Partager</span>
                  </div>
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

      {/* Modal pour rédiger manuellement */}
      <SocialContentWriterModal
        isOpen={isWriterModalOpen}
        onClose={() => setIsWriterModalOpen(false)}
        onSave={handleWriterModalSave}
        initialContent={socialContent}
        initialHashtags={hashtags}
      />
    </div>
  );
}