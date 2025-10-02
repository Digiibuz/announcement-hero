import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X, ImageIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import SparklingStars from "@/components/ui/SparklingStars";
import SocialMediaImageSelector from "../../SocialMediaImageSelector";

interface FacebookTabProps {
  form: UseFormReturn<any>;
}

export const FacebookTab = ({ form }: FacebookTabProps) => {
  const [newHashtag, setNewHashtag] = useState("");
  const [showImageSelector, setShowImageSelector] = useState(false);
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const hashtags = form.watch("facebook_hashtags") || [];
  const images = form.watch("images") || [];
  const additionalMedias = form.watch("additionalMedias") || [];
  const selectedImages = form.watch("facebook_images") || [];

  const handleGenerateContent = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    
    const optimizedContent = await optimizeContent("generateSocialContent", title, description);
    if (optimizedContent) {
      form.setValue("facebook_content", optimizedContent);
    }
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.startsWith("#") ? newHashtag : `#${newHashtag}`;
      form.setValue("facebook_hashtags", [...hashtags, tag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (index: number) => {
    form.setValue("facebook_hashtags", hashtags.filter((_: string, i: number) => i !== index));
  };

  const contentLength = form.watch("facebook_content")?.length || 0;
  const hashtagCount = hashtags.length;
  const allMedias = [...images, ...additionalMedias];

  return (
    <div className="w-full pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateSocialContent} />
      <SparklingStars />

      {/* Images pleine largeur */}
      <div className="relative w-full bg-background">
        {selectedImages.length > 0 ? (
          <div className={`w-full overflow-hidden bg-muted relative ${
            selectedImages.length === 1 ? 'aspect-video' : 'grid grid-cols-2 gap-0.5'
          }`}>
            {selectedImages.slice(0, 4).map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={`Publication ${idx + 1}`}
                className={`w-full h-full object-cover ${selectedImages.length === 1 ? '' : 'aspect-square'}`}
              />
            ))}
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
          <div className="aspect-video w-full flex items-center justify-center bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(true)}
              className="flex-col h-auto py-6"
            >
              <ImageIcon className="h-8 w-8 mb-2" />
              <span>Sélectionner des images</span>
            </Button>
          </div>
        )}
      </div>

      {/* Sélecteur d'images en dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner des images pour Facebook</DialogTitle>
          </DialogHeader>
          <SocialMediaImageSelector
            form={form}
            fieldName="facebook_images"
            label=""
            maxImages={10}
          />
        </DialogContent>
      </Dialog>

      {/* Contenu - pleine largeur */}
      <div className="px-4 space-y-4 mt-4">
        {/* Texte de publication */}
        <FormField
          control={form.control}
          name="facebook_content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-base">Texte de publication</FormLabel>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{contentLength}/2200</span>
                  <span># {hashtagCount}/30</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={isOptimizing.generateSocialContent}
                    className="h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Rédigez votre publication Facebook..."
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
