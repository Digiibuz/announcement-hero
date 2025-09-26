import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreHorizontal, Hash, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { useToast } from "@/hooks/use-toast";

interface EditableSocialPreviewProps {
  form: UseFormReturn<AnnouncementFormData>;
  socialContent: string;
  setSocialContent: (content: string) => void;
  hashtags: string[];
  setHashtags: (hashtags: string[]) => void;
  selectedImages: { url: string }[];
  onGenerateContent: () => void;
  isGenerating: boolean;
}

export default function EditableSocialPreview({
  form,
  socialContent,
  setSocialContent,
  hashtags,
  setHashtags,
  selectedImages,
  onGenerateContent,
  isGenerating
}: EditableSocialPreviewProps) {
  const { toast } = useToast();
  const [newHashtag, setNewHashtag] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState(socialContent);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempContent(socialContent);
  }, [socialContent]);

  const handleContentClick = () => {
    if (!isEditingContent) {
      setIsEditingContent(true);
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          // Placer le curseur à la fin
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    setSocialContent(tempContent);
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleContentBlur();
    }
    if (e.key === "Escape") {
      setTempContent(socialContent);
      setIsEditingContent(false);
    }
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    setTempContent(text);
  };

  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      const cleanTag = newHashtag.trim().replace(/^#/, "");
      if (cleanTag.length > 0) {
        setHashtags([...hashtags, cleanTag]);
        setNewHashtag("");
      }
    } else if (hashtags.includes(newHashtag.trim())) {
      toast({
        title: "Hashtag déjà ajouté",
        description: "Ce hashtag est déjà dans votre liste",
        variant: "destructive",
      });
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag();
    }
  };

  const renderContent = () => {
    if (isEditingContent) {
      return (
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentBlur}
          onInput={handleContentInput}
          onKeyDown={handleContentKeyDown}
          className="min-h-[60px] p-2 border border-dashed border-blue-400 rounded outline-none focus:border-blue-600 bg-blue-50/30"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {tempContent}
        </div>
      );
    }

    return (
      <div
        onClick={handleContentClick}
        className="min-h-[60px] p-2 cursor-text hover:bg-gray-50/50 rounded transition-colors"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {socialContent || (
          <span className="text-gray-400 italic">
            Cliquez ici pour éditer le contenu ou générez-le avec l'IA...
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bouton de génération IA */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prévisualisation Facebook</h3>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onGenerateContent}
          disabled={isGenerating}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Génération en cours..." : "🚀 Générer avec l'IA"}
        </Button>
      </div>

      {/* Preview Facebook */}
      <Card className="max-w-lg mx-auto bg-white shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://via.placeholder.com/40x40/4267B2/ffffff?text=FB" />
                <AvatarFallback className="bg-blue-600 text-white">FB</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">Votre Page Facebook</div>
                <div className="text-xs text-gray-500 flex items-center">
                  Il y a quelques instants • 🌍
                </div>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Contenu éditable */}
          <div className="space-y-2">
            {renderContent()}
            
            {isEditingContent && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <span>💡 Ctrl+Entrée pour sauvegarder, Échap pour annuler</span>
              </div>
            )}
          </div>

          {/* Hashtags éditables */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer group"
                  onClick={() => removeHashtag(tag)}
                >
                  #{tag}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  placeholder="Ajouter un hashtag"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addHashtag}
                disabled={!newHashtag.trim()}
                className="h-8 px-3 text-xs"
              >
                Ajouter
              </Button>
            </div>
          </div>

          {/* Images */}
          {selectedImages && selectedImages.length > 0 && (
            <div className="space-y-2">
              {selectedImages.length === 1 ? (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedImages[0].url}
                    alt="Publication"
                    className="w-full h-64 object-cover"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                  {selectedImages.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`Publication ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {index === 3 && selectedImages.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            +{selectedImages.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions Facebook */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex space-x-6">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="h-5 w-5" />
                <span className="text-sm">J'aime</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">Commenter</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-green-500 transition-colors">
                <Share className="h-5 w-5" />
                <span className="text-sm">Partager</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1 bg-blue-50/50 p-3 rounded-lg">
        <p className="font-medium">💡 Conseils d'édition :</p>
        <p>• Cliquez sur le texte pour l'éditer directement</p>
        <p>• Ajoutez des hashtags en cliquant sur l'input ou en tapant Entrée</p>
        <p>• Cliquez sur un hashtag pour le supprimer</p>
        <p>• Générez du contenu optimisé avec l'IA</p>
      </div>
    </div>
  );
}