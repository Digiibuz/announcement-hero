import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X, ImageIcon, Crop, Trash2, ChevronLeft, ChevronRight, Plus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import { useInstagramAutoCrop } from "@/hooks/useInstagramAutoCrop";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import SparklingStars from "@/components/ui/SparklingStars";
import SocialMediaImageSelector from "../../SocialMediaImageSelector";
import { ImageCropDialog } from "../../ImageCropDialog";
import SocialAIGenerationDialog from "../../SocialAIGenerationDialog";
import { toast } from "sonner";

interface InstagramTabProps {
  form: UseFormReturn<any>;
}

export const InstagramTab = ({ form }: InstagramTabProps) => {
  const [newHashtag, setNewHashtag] = useState("");
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [imageCompatibility, setImageCompatibility] = useState<Record<number, boolean>>({});
  const [croppedImages, setCroppedImages] = useState<Record<number, boolean>>({});
  
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const { checkImageCompatibility, autoCropImage, isProcessing } = useInstagramAutoCrop();
  
  const hashtags = form.watch("instagramHashtags") || [];
  const images = form.watch("images") || [];
  const additionalMedias = form.watch("additionalMedias") || [];
  const selectedImages = form.watch("instagramImages") || [];
  const imageAspectRatios = form.watch("instagram_image_aspect_ratios") || [];

  // Vérifier la compatibilité de toutes les images
  useEffect(() => {
    const checkAllImages = async () => {
      if (selectedImages.length === 0) return;
      
      const compatibility: Record<number, boolean> = {};
      for (let i = 0; i < selectedImages.length; i++) {
        const result = await checkImageCompatibility(selectedImages[i]);
        compatibility[i] = result.isCompatible;
      }
      setImageCompatibility(compatibility);
    };
    
    checkAllImages();
  }, [selectedImages.length]);

  // Auto-sélection de toutes les images disponibles (max 10) SANS recadrage automatique
  useEffect(() => {
    const selectImages = async () => {
      const allMedias = [...images, ...additionalMedias];
      if (allMedias.length > 0 && selectedImages.length === 0) {
        const imagesToSelect = allMedias.slice(0, 10);
        const aspectRatios: number[] = imagesToSelect.map(() => 1);

        form.setValue("instagramImages", imagesToSelect);
        form.setValue("instagram_image_aspect_ratios", aspectRatios);
      }
    };
    
    selectImages();
  }, [images, additionalMedias]);

  const handleGenerateContent = async (useAnnouncementContent: boolean, customInstructions: string) => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    
    const baseContent = useAnnouncementContent ? description : "";
    const optimizedContent = await optimizeContent(
      "generateSocialContent", 
      title, 
      baseContent,
      { tone: "convivial", length: "standard" },
      customInstructions
    );
    
    if (optimizedContent) {
      form.setValue("instagramContent", optimizedContent);
    }
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.startsWith("#") ? newHashtag : `#${newHashtag}`;
      form.setValue("instagramHashtags", [...hashtags, tag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (index: number) => {
    form.setValue("instagramHashtags", hashtags.filter((_: string, i: number) => i !== index));
  };

  const contentLength = form.watch("instagramContent")?.length || 0;
  const hashtagCount = hashtags.length;

  const handleCropComplete = (croppedImageUrl: string, aspectRatio?: number) => {
    if (cropImageIndex !== null) {
      const updatedImages = [...selectedImages];
      updatedImages[cropImageIndex] = croppedImageUrl;
      form.setValue("instagramImages", updatedImages);
      
      if (aspectRatio) {
        const updatedRatios = [...imageAspectRatios];
        updatedRatios[cropImageIndex] = aspectRatio;
        form.setValue("instagram_image_aspect_ratios", updatedRatios);
      }
      
      // Marquer l'image comme recadrée
      setCroppedImages(prev => ({
        ...prev,
        [cropImageIndex]: true
      }));
      
      setCropImageIndex(null);
    }
  };

  const handleDeleteImage = (index: number) => {
    const updatedImages = selectedImages.filter((_: string, i: number) => i !== index);
    const updatedRatios = imageAspectRatios.filter((_: number, i: number) => i !== index);
    form.setValue("instagramImages", updatedImages);
    form.setValue("instagram_image_aspect_ratios", updatedRatios);
    if (currentImageIndex >= updatedImages.length && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0));
  };

  const currentAspectRatio = imageAspectRatios[currentImageIndex] || 1;
  const isCurrentImageCompatible = imageCompatibility[currentImageIndex] ?? true;
  const isCurrentImageCropped = croppedImages[currentImageIndex] ?? false;
  const hasIncompatibleImages = selectedImages.some((_, index) => 
    !imageCompatibility[index] && !croppedImages[index]
  );

  // Exposer l'état de compatibilité pour que le bouton "Suivant" puisse être désactivé
  useEffect(() => {
    (window as any).instagramImagesReady = !hasIncompatibleImages && selectedImages.length > 0;
  }, [hasIncompatibleImages, selectedImages.length]);

  return (
    <div className="w-full pb-8">
      <AILoadingOverlay isVisible={isOptimizing.generateSocialContent} />
      <SparklingStars />

      {/* Carrousel d'images avec aspect ratio dynamique */}
      <div className="relative w-full bg-background">
        {selectedImages.length > 0 ? (
          <div className="relative">
            <div 
              className="w-full overflow-hidden bg-muted relative"
              style={{ aspectRatio: currentAspectRatio }}
            >
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Publication Instagram ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de recadrage requis */}
              {!isCurrentImageCompatible && !isCurrentImageCropped && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                  <div className="text-center space-y-2">
                    <Crop className="h-12 w-12 text-white mx-auto" />
                    <p className="text-white font-semibold text-lg">Recadrage nécessaire</p>
                    <p className="text-white/80 text-sm max-w-xs">
                      Cette image doit être ajustée aux formats Instagram
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      setCropImageIndex(currentImageIndex);
                      setShowCropDialog(true);
                    }}
                    className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
                  >
                    <Crop className="h-5 w-5 mr-2" />
                    Recadrer maintenant
                  </Button>
                </div>
              )}
              
              {/* Badge de compatibilité */}
              <div className="absolute top-4 left-4">
                {isCurrentImageCropped ? (
                  <Badge className="bg-green-500/90 hover:bg-green-500 text-white gap-1.5 shadow-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Image recadrée
                  </Badge>
                ) : isCurrentImageCompatible ? (
                  <Badge className="bg-green-500/90 hover:bg-green-500 text-white gap-1.5 shadow-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Prêt pour Instagram
                  </Badge>
                ) : (
                  <Badge className="gap-1.5 bg-amber-500 text-white shadow-lg animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Recadrage requis
                  </Badge>
                )}
              </div>
              
              {/* Contrôles d'image */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCropImageIndex(currentImageIndex);
                    setShowCropDialog(true);
                  }}
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <Crop className="h-5 w-5" />
                </Button>
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

              {/* Navigation carrousel */}
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
          <div 
            className="w-full flex items-center justify-center bg-muted/20"
            style={{ aspectRatio: 1 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(true)}
              className="flex-col h-auto py-6"
            >
              <ImageIcon className="h-8 w-8 mb-2" />
              <span>Sélectionner des images</span>
              <span className="text-xs text-muted-foreground mt-1">Jusqu'à 10 images</span>
            </Button>
          </div>
        )}
      </div>

      {/* Sélecteur d'images en dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Sélectionner des images pour Instagram ({selectedImages.length}/10)
            </DialogTitle>
          </DialogHeader>
          <SocialMediaImageSelector
            form={form}
            fieldName="instagramImages"
            label=""
            maxImages={10}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de recadrage */}
      {selectedImages.length > 0 && cropImageIndex !== null && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={(open) => {
            setShowCropDialog(open);
            if (!open) setCropImageIndex(null);
          }}
          imageUrl={selectedImages[cropImageIndex]}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Contenu - même largeur que l'image, sans padding */}
      <div className="space-y-4 mt-4">
        {/* Légende */}
        <FormField
          control={form.control}
          name="instagramContent"
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
                    onClick={() => setShowAIDialog(true)}
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
                  className="min-h-[120px] resize-none border border-input bg-card"
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
              className="flex-1 border border-input bg-card"
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

      {/* Dialog de configuration IA */}
      <SocialAIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerate={handleGenerateContent}
        platform="instagram"
        isGenerating={isOptimizing.generateSocialContent}
      />
    </div>
  );
};
