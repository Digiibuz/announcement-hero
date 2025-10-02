import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X, ImageIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import SparklingStars from "@/components/ui/SparklingStars";
import SocialMediaImageSelector from "../../SocialMediaImageSelector";

interface InstagramTabProps {
  form: UseFormReturn<any>;
}

export const InstagramTab = ({ form }: InstagramTabProps) => {
  const [newHashtag, setNewHashtag] = useState("");
  const [showImageSelector, setShowImageSelector] = useState(false);
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const hashtags = form.watch("instagram_hashtags") || [];
  const images = form.watch("images") || [];
  const additionalMedias = form.watch("additionalMedias") || [];
  const selectedImages = form.watch("instagram_images") || [];

  // Auto-sélection de la 1ère image disponible
  useEffect(() => {
    const allMedias = [...images, ...additionalMedias];
    if (allMedias.length > 0 && selectedImages.length === 0) {
      form.setValue("instagram_images", [allMedias[0]]);
    }
  }, [images, additionalMedias]);

  const handleGenerateContent = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    
    const optimizedContent = await optimizeContent("generateSocialContent", title, description);
    if (optimizedContent) {
      form.setValue("instagram_content", optimizedContent);
    }
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.startsWith("#") ? newHashtag : `#${newHashtag}`;
      form.setValue("instagram_hashtags", [...hashtags, tag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (index: number) => {
    form.setValue("instagram_hashtags", hashtags.filter((_: string, i: number) => i !== index));
  };

  const contentLength = form.watch("instagram_content")?.length || 0;
  const hashtagCount = hashtags.length;

  return (
    <div className="w-full pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateSocialContent} />
      <SparklingStars />

      {/* Image principale pleine largeur */}
      <div className="relative w-full bg-background">
        {selectedImages.length > 0 ? (
          <div className="aspect-square w-full overflow-hidden bg-muted relative">
            <img
              src={selectedImages[0]}
              alt="Publication Instagram"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowImageSelector(true)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="aspect-square w-full flex items-center justify-center bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(true)}
              className="flex-col h-auto py-6"
            >
              <ImageIcon className="h-8 w-8 mb-2" />
              <span>Sélectionner une image</span>
            </Button>
          </div>
        )}
      </div>

      {/* Sélecteur d'images en dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner une image pour Instagram</DialogTitle>
          </DialogHeader>
          <SocialMediaImageSelector
            form={form}
            fieldName="instagram_images"
            label=""
            maxImages={1}
          />
        </DialogContent>
      </Dialog>

      {/* Contenu - pleine largeur */}
      <div className="px-4 space-y-4 mt-4">
        {/* Légende */}
        <FormField
          control={form.control}
          name="instagram_content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-base">Légende</FormLabel>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{contentLength}/2200</span>
                  <span># {hashtagCount}/30</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={isOptimizing.generateSocialContent}
                    className="h-8 w-8 p-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Rédigez une belle légende pour votre publication..."
                  className="min-h-[120px] resize-none border-0 bg-muted/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={2200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hashtags */}
        <FormItem>
          <FormLabel className="text-base">Hashtags</FormLabel>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ajouter un hashtag"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              className="flex-1 border-0 bg-muted/30 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="button" onClick={addHashtag} variant="ghost" size="sm">
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {hashtags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeHashtag(index)}
                />
              </Badge>
            ))}
          </div>
        </FormItem>
      </div>
    </div>
  );
};
