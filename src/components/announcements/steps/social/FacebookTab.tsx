import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ImageIcon, Trash2 } from "lucide-react";
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
  };

  const contentLength = form.watch("facebookContent")?.length || 0;

  return (
    <div className="w-full pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateFacebookContent} />
      <SparklingStars />

      {/* Images au format Facebook */}
      <div className="relative w-full bg-background">
        {selectedImages.length > 0 ? (
          <div className="relative">
            {/* Affichage style Facebook selon le nombre d'images */}
            {selectedImages.length === 1 ? (
              // 1 image : format paysage complet
              <div className="relative w-full aspect-video bg-muted overflow-hidden">
                <img
                  src={selectedImages[0]}
                  alt="Publication Facebook"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteImage(0)}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ) : selectedImages.length === 2 ? (
              // 2 images : côte à côte
              <div className="grid grid-cols-2 gap-0.5 w-full">
                {selectedImages.slice(0, 2).map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square bg-muted overflow-hidden">
                    <img
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(idx)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : selectedImages.length === 3 ? (
              // 3 images : 1 grande à gauche, 2 petites empilées à droite
              <div className="grid grid-cols-2 gap-0.5 w-full">
                <div className="relative row-span-2 aspect-square bg-muted overflow-hidden">
                  <img
                    src={selectedImages[0]}
                    alt="Image 1"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteImage(0)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {selectedImages.slice(1, 3).map((img: string, idx: number) => (
                  <div key={idx + 1} className="relative aspect-[2/1] bg-muted overflow-hidden">
                    <img
                      src={img}
                      alt={`Image ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(idx + 1)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              // 4+ images : grille 2x2 (affiche les 4 premières)
              <div className="grid grid-cols-2 gap-0.5 w-full">
                {selectedImages.slice(0, 4).map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square bg-muted overflow-hidden">
                    <img
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 3 && selectedImages.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          +{selectedImages.length - 4}
                        </span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(idx)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Bouton pour gérer les images */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(true)}
              className="mt-2 w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Gérer les images ({selectedImages.length}/10)
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
