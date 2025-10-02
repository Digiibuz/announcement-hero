import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const INITIAL_CROP = { x: 0, y: 0 };
const INITIAL_ZOOM = 1;

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatios?: { label: string; value: number }[];
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
};

export const ImageCropDialog = ({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  aspectRatios = [
    { label: "Carré 1:1", value: 1 },
    { label: "Portrait 4:5", value: 4 / 5 },
    { label: "Paysage 1.91:1", value: 1.91 },
  ],
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleReset = useCallback(() => {
    setCrop(INITIAL_CROP);
    setZoom(INITIAL_ZOOM);
    toast.info("Recadrage réinitialisé");
  }, []);

  const handleCropConfirm = useCallback(async () => {
    try {
      if (!croppedAreaPixels) return;
      
      setIsProcessing(true);
      
      // Créer l'image recadrée comme blob
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      
      // Téléverser l'image recadrée sur Supabase
      const fileExt = 'jpg';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_cropped.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, croppedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (error) {
        throw error;
      }
      
      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      onCropComplete(urlData.publicUrl);
      onOpenChange(false);
      toast.success("Image recadrée et sauvegardée avec succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du recadrage");
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageUrl, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Recadrer l'image pour Instagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Sélection du format */}
          <div className="flex flex-wrap gap-2 justify-center">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio.label}
                type="button"
                variant={selectedAspectRatio.value === ratio.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAspectRatio(ratio)}
                className="text-xs sm:text-sm flex-1 min-w-[90px] sm:flex-none"
              >
                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{ratio.label}</span>
                <span className="sm:hidden">{ratio.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>

          {/* Zone de recadrage */}
          <div className="relative h-[250px] sm:h-[350px] md:h-[400px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={selectedAspectRatio.value}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
            />
          </div>

          {/* Contrôle du zoom */}
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4">
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button
            type="button"
            onClick={handleCropConfirm}
            className="w-full sm:w-auto"
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isProcessing ? "Sauvegarde..." : "Appliquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
