import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const INSTAGRAM_RATIOS = {
  SQUARE: 1,
  PORTRAIT: 4 / 5,
  LANDSCAPE: 1.91,
};

const TOLERANCE = 0.05;

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const isInstagramCompatible = (imageRatio: number): boolean => {
  return (
    Math.abs(imageRatio - INSTAGRAM_RATIOS.SQUARE) < TOLERANCE ||
    Math.abs(imageRatio - INSTAGRAM_RATIOS.PORTRAIT) < TOLERANCE ||
    Math.abs(imageRatio - INSTAGRAM_RATIOS.LANDSCAPE) < TOLERANCE
  );
};

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

export const useInstagramAutoCrop = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkImageCompatibility = async (imageUrl: string): Promise<{
    isCompatible: boolean;
    currentRatio: number;
  }> => {
    try {
      const image = await createImage(imageUrl);
      const ratio = image.naturalWidth / image.naturalHeight;
      return {
        isCompatible: isInstagramCompatible(ratio),
        currentRatio: ratio,
      };
    } catch (error) {
      console.error("Erreur lors de la vérification de l'image:", error);
      return { isCompatible: true, currentRatio: 1 };
    }
  };

  const autoCropImage = async (imageUrl: string): Promise<{
    croppedUrl: string;
    aspectRatio: number;
  } | null> => {
    try {
      setIsProcessing(true);
      
      const image = await createImage(imageUrl);
      const imageRatio = image.naturalWidth / image.naturalHeight;
      
      // Si l'image est déjà compatible, ne rien faire
      if (isInstagramCompatible(imageRatio)) {
        return null;
      }

      // Recadrer en carré (1:1) centré
      const targetRatio = INSTAGRAM_RATIOS.SQUARE;
      let cropWidth: number;
      let cropHeight: number;
      let cropX: number;
      let cropY: number;

      if (imageRatio > targetRatio) {
        // Image trop large - recadrer la largeur
        cropHeight = image.naturalHeight;
        cropWidth = cropHeight * targetRatio;
        cropX = (image.naturalWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Image trop haute - recadrer la hauteur
        cropWidth = image.naturalWidth;
        cropHeight = cropWidth / targetRatio;
        cropX = 0;
        cropY = (image.naturalHeight - cropHeight) / 2;
      }

      const pixelCrop: Area = {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      };

      // Créer l'image recadrée
      const croppedBlob = await getCroppedImg(imageUrl, pixelCrop);

      // Téléverser sur Supabase
      const fileName = `${Math.random().toString(36).substring(2, 15)}_autocrop.jpg`;
      const filePath = `announcements/${fileName}`;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, croppedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (error) {
        throw error;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);

      return {
        croppedUrl: urlData.publicUrl,
        aspectRatio: targetRatio,
      };
    } catch (error) {
      console.error("Erreur lors du recadrage automatique:", error);
      toast.error("Erreur lors du recadrage automatique");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    checkImageCompatibility,
    autoCropImage,
    isProcessing,
  };
};
