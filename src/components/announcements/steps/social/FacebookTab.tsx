import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateSocialContent} />
      <SparklingStars />

      {/* Images */}
      <div className="relative">
        {selectedImages.length > 0 ? (
          <div className={`rounded-2xl overflow-hidden bg-muted border-2 border-border ${
            selectedImages.length === 1 ? 'aspect-video' : 'grid grid-cols-2 gap-1'
          }`}>
            {selectedImages.slice(0, 4).map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={`Publication ${idx + 1}`}
                className={`w-full h-full object-cover ${selectedImages.length === 1 ? '' : 'aspect-square'}`}
              />
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Aucune image sélectionnée</p>
              <p className="text-xs mt-1">Sélectionnez une ou plusieurs images dans l'étape précédente</p>
            </div>
          </div>
        )}
      </div>

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
                className="min-h-[120px] resize-none"
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
            className="flex-1"
          />
          <Button type="button" onClick={addHashtag} variant="outline" size="sm">
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
  );
};
