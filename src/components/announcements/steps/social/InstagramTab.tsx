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

interface InstagramTabProps {
  form: UseFormReturn<any>;
}

export const InstagramTab = ({ form }: InstagramTabProps) => {
  const [newHashtag, setNewHashtag] = useState("");
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const hashtags = form.watch("instagram_hashtags") || [];
  const images = form.watch("images") || [];
  const additionalMedias = form.watch("additionalMedias") || [];
  const selectedImages = form.watch("instagram_images") || [];

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

  return (
    <div className="space-y-6">
      <AILoadingOverlay isVisible={isOptimizing.generateSocialContent} />
      <SparklingStars />

      {/* Contenu */}
      <FormField
        control={form.control}
        name="instagram_content"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Légende Instagram</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={isOptimizing.generateSocialContent}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec l'IA
              </Button>
            </div>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Le contenu optimisé pour Instagram apparaîtra ici..."
                className="min-h-[150px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hashtags */}
      <FormItem>
        <FormLabel>Hashtags Instagram</FormLabel>
        <div className="flex gap-2">
          <Input
            placeholder="Ajouter un hashtag"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
          />
          <Button type="button" onClick={addHashtag} variant="outline">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {hashtags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeHashtag(index)}
              />
            </Badge>
          ))}
        </div>
      </FormItem>

      {/* Note: Les images seront sélectionnées dans le sélecteur principal */}
      <FormItem>
        <FormLabel>Images sélectionnées pour Instagram</FormLabel>
        <div className="text-sm text-muted-foreground">
          {selectedImages.length} image(s) sélectionnée(s) depuis l'étape Images
        </div>
      </FormItem>

      {/* Prévisualisation Instagram */}
      <div className="border rounded-lg p-4 bg-card">
        <h3 className="font-medium mb-3">Aperçu Instagram</h3>
        <div className="bg-background rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="font-semibold text-sm">votre_compte</div>
          </div>
          
          {/* Images */}
          {selectedImages.length > 0 && (
            <div className="aspect-square bg-muted">
              <img src={selectedImages[0]} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Content */}
          <div className="p-3 space-y-2">
            <div className="text-sm">
              <span className="font-semibold">votre_compte </span>
              {form.watch("instagram_content") || "Votre légende apparaîtra ici..."}
            </div>
            {hashtags.length > 0 && (
              <p className="text-sm text-primary">{hashtags.join(" ")}</p>
            )}
            <div className="text-xs text-muted-foreground">À L'INSTANT</div>
          </div>
        </div>
      </div>
    </div>
  );
};
