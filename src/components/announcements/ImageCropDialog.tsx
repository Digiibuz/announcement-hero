import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

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

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Canvas is empty");
      }
      const fileUrl = URL.createObjectURL(blob);
      resolve(fileUrl);
    }, "image/jpeg");
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    try {
      if (!croppedAreaPixels) return;
      
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropComplete(croppedImage);
      onOpenChange(false);
      toast.success("Image recadrée avec succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du recadrage");
    }
  }, [croppedAreaPixels, imageUrl, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Recadrer l'image pour Instagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du format */}
          <div className="flex gap-2 justify-center">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio.label}
                type="button"
                variant={selectedAspectRatio.value === ratio.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAspectRatio(ratio)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                {ratio.label}
              </Button>
            ))}
          </div>

          {/* Zone de recadrage */}
          <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
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
          <div className="flex items-center gap-4 px-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleCropConfirm}
          >
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
