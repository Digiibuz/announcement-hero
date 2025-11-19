import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ImageIcon, Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import SparklingStars from "@/components/ui/SparklingStars";
import SocialMediaImageSelector from "../../SocialMediaImageSelector";
import SocialAIGenerationDialog from "../../SocialAIGenerationDialog";

interface FacebookTabProps {
  form: UseFormReturn<any>;
}

export const FacebookTab = ({ form }: FacebookTabProps) => {
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const images = form.watch("images") || [];
  const additionalMedias = form.watch("additionalMedias") || [];
  const selectedImages = form.watch("facebookImages") || [];

  // Auto-sélection de toutes les images disponibles (max 10)
  useEffect(() => {
    const allMedias = [...images, ...additionalMedias];
    if (allMedias.length > 0 && selectedImages.length === 0) {
      form.setValue("facebookImages", allMedias.slice(0, 10));
    }
  }, [images, additionalMedias]);

  const handleGenerateContent = async (useAnnouncementContent: boolean, customInstructions: string) => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    
    console.log("Génération de contenu Facebook - Titre:", title, "Description:", description);
    console.log("Utiliser contenu annonce:", useAnnouncementContent);
    console.log("Instructions personnalisées:", customInstructions);
    
    const baseContent = useAnnouncementContent ? description : "";
    const optimizedContent = await optimizeContent(
      "generateFacebookContent", 
      title, 
      baseContent,
      { tone: "convivial", length: "standard" },
      customInstructions
    );
    
    console.log("Contenu optimisé reçu:", optimizedContent);
    
    if (optimizedContent) {
      form.setValue("facebookContent", optimizedContent);
      console.log("Contenu Facebook mis à jour");
    }
  };

  const handleDeleteImage = (index: number) => {
    const updatedImages = selectedImages.filter((_: string, i: number) => i !== index);
    form.setValue("facebookImages", updatedImages);
    
    if (currentImageIndex >= updatedImages.length && updatedImages.length > 0) {
      setCurrentImageIndex(updatedImages.length - 1);
    } else if (updatedImages.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0));
  };

  const contentLength = form.watch("facebookContent")?.length || 0;

  return (
    <div className="w-full pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateFacebookContent} />
      <SparklingStars />

      {/* Images pleine largeur avec carrousel */}
      <div className="relative w-full bg-background">
        {selectedImages.length > 0 ? (
          <div className="relative">
            <div className="w-full aspect-video overflow-hidden bg-muted relative">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Publication Facebook ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Contrôles d'image */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteImage(currentImageIndex)}
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                {selectedImages.length < 10 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowImageSelector(true)}
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              {/* Navigation entre images */}
              {selectedImages.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Indicateurs de position */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedImages.map((_: string, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'w-6 bg-white' 
                            : 'w-1.5 bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Compteur */}
                  <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {selectedImages.length}
                  </div>
                </>
              )}
            </div>
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
            fieldName="facebookImages"
            label=""
            maxImages={10}
          />
        </DialogContent>
      </Dialog>

      {/* Contenu - même largeur que l'image, sans padding */}
      <div className="space-y-4 mt-4">
        {/* Texte de publication */}
        <FormField
          control={form.control}
          name="facebookContent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-base">Texte de publication</FormLabel>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{contentLength}/2200</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIDialog(true)}
                    disabled={isOptimizing.generateFacebookContent}
                    className="h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Rédigez votre publication Facebook avec hashtags intégrés..."
                  className="min-h-[150px] resize-none border border-input bg-card"
                  maxLength={2200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dialog de configuration IA */}
      <SocialAIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerate={handleGenerateContent}
        platform="facebook"
        isGenerating={isOptimizing.generateFacebookContent}
      />
    </div>
  );
};
