import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Square, Maximize2, RectangleHorizontal, ZoomIn, X } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onUseOriginal?: () => void;
  aspectRatios?: { label: string; value: number; icon: React.ReactNode }[];
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
  onUseOriginal,
  aspectRatios = [
    { label: "Carré (1:1)", value: 1, icon: <Square className="h-4 w-4" /> },
    { label: "Portrait (4:5)", value: 4 / 5, icon: <Maximize2 className="h-4 w-4" /> },
    { label: "Paysage (1.91:1)", value: 1.91, icon: <RectangleHorizontal className="h-4 w-4" /> },
  ],
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1");

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

  const handleUseOriginal = useCallback(() => {
    if (onUseOriginal) {
      onUseOriginal();
      onOpenChange(false);
      toast.success("Image originale restaurée !");
    }
  }, [onUseOriginal, onOpenChange]);

  const currentAspectRatio = aspectRatios.find(r => r.value.toString() === selectedAspectRatio)?.value || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 bg-white max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        {/* Header personnalisé */}
        <div className="px-4 pt-4 pb-3 border-b sm:px-8 sm:pt-8 sm:pb-6">
          <div className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-2xl font-semibold text-gray-900">
              Redimensionner pour Instagram
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-600 font-normal">
              Choisissez le format Instagram souhaité. L'image sera automatiquement recadrée depuis le centre.
            </p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 sm:px-8 sm:py-6 sm:space-y-6">
          {/* Sélection du format */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Format Instagram</h3>
            <RadioGroup
              value={selectedAspectRatio}
              onValueChange={setSelectedAspectRatio}
              className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4"
            >
              {aspectRatios.map((ratio) => (
                <div key={ratio.value}>
                  <RadioGroupItem
                    value={ratio.value.toString()}
                    id={`ratio-${ratio.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`ratio-${ratio.value}`}
                    className="flex items-center gap-2 sm:gap-3 rounded-lg border-2 border-gray-200 p-3 sm:p-4 cursor-pointer hover:border-gray-300 peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-50 transition-all"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-300 peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-500 relative flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-data-[state=checked]:opacity-100" />
                    </div>
                    {ratio.icon}
                    <span className="text-sm font-medium text-gray-900">{ratio.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Zone de recadrage */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Recadrage interactif</h3>
            <div className="relative h-[280px] sm:h-[420px] bg-gray-400 rounded-lg overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={currentAspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                objectFit="contain"
                style={{
                  containerStyle: {
                    backgroundColor: '#9CA3AF',
                  },
                }}
              />
            </div>
            <p className="text-xs sm:text-sm text-center text-gray-600">
              Glissez pour repositionner • Molette pour zoomer
            </p>
          </div>

          {/* Contrôle du zoom */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4 text-gray-900" />
              <span className="text-sm font-semibold text-gray-900">Zoom</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t bg-white flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 sm:px-8 sm:py-6">
          <div className="flex gap-2">
            {onUseOriginal && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUseOriginal}
                className="w-full sm:w-auto sm:px-6"
              >
                Utiliser l'image originale
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto sm:px-6"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="w-full sm:w-auto sm:px-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            >
              Appliquer le redimensionnement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
