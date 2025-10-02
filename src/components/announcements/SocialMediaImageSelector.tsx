import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, GripVertical, Check, Plus, Upload, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heic2any from "heic2any";

interface SocialMediaImageSelectorProps {
  form: UseFormReturn<any>;
  fieldName: string;
  label?: string;
  maxImages?: number;
}

interface ImageItem {
  url: string;
  selected: boolean;
  id: string; // Utiliser un ID unique au lieu de l'index
}

export default function SocialMediaImageSelector({ 
  form, 
  fieldName, 
  label = "Sélectionner des images",
  maxImages = 10 
}: SocialMediaImageSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchedValues = form.watch();
  const { images = [], additionalMedias = [] } = watchedValues;
  const selectedImages = form.watch(fieldName) || [];

  // Combiner toutes les images disponibles
  const allImages = [...(images || []), ...(additionalMedias || [])];

  const toggleImage = (imageUrl: string) => {
    const currentSelected = selectedImages as string[];
    
    if (currentSelected.includes(imageUrl)) {
      // Retirer l'image
      form.setValue(fieldName, currentSelected.filter((url: string) => url !== imageUrl));
    } else {
      // Ajouter l'image (si limite non atteinte)
      if (currentSelected.length < maxImages) {
        form.setValue(fieldName, [...currentSelected, imageUrl]);
      }
    }
  };

  const isSelected = (imageUrl: string) => {
    return (selectedImages as string[]).includes(imageUrl);
  };

  // Upload functions
  const checkWebPSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };

  const isHeicFile = (file: File): boolean => {
    return file.type === 'image/heic' || 
           file.type === 'image/heif' || 
           file.name.toLowerCase().endsWith('.heic') || 
           file.name.toLowerCase().endsWith('.heif');
  };

  const convertHeicToWebP = async (file: File): Promise<File> => {
    const webpSupported = await checkWebPSupport();
    const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
    const extension = webpSupported ? '.webp' : '.jpg';
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: targetFormat,
      quality: 0.85
    }) as Blob;
    
    const fileName = file.name.replace(/\.heic$/i, extension);
    return new File([convertedBlob], fileName, { type: targetFormat });
  };

  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise(async (resolve, reject) => {
      const webpSupported = await checkWebPSupport();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
          const extension = webpSupported ? '.webp' : '.jpg';
          
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error("Conversion failed"));
              return;
            }
            
            const fileName = file.name.split('.')[0] + extension;
            resolve(new File([blob], fileName, { type: targetFormat }));
          }, targetFormat, 0.85);
        };
        
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
      };
      
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let processedFile = file;
        
        if (isHeicFile(file)) {
          processedFile = await convertHeicToWebP(file);
        } else {
          processedFile = await convertToWebP(file);
        }
        
        const url = await uploadFile(processedFile);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        // Ajouter aux images additionnelles
        const currentAdditionalMedias = form.getValues('additionalMedias') || [];
        form.setValue('additionalMedias', [...currentAdditionalMedias, ...uploadedUrls]);
        
        // Ajouter aux images sélectionnées si on n'a pas atteint la limite
        const currentSelected = selectedImages as string[];
        const remainingSlots = maxImages - currentSelected.length;
        if (remainingSlots > 0) {
          const newSelected = [...currentSelected, ...uploadedUrls.slice(0, remainingSlots)];
          form.setValue(fieldName, newSelected);
        }
        
        toast.success(`${uploadedUrls.length} image(s) ajoutée(s)`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (allImages.length === 0 && !isUploading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aucune image disponible. Ajoutez-en une pour commencer.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des images
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {label}
          </div>
          <Badge variant="secondary">
            {selectedImages.length}/{maxImages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bouton pour ajouter des images */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des images
              </>
            )}
          </Button>
        </div>
        
        {/* Grille d'images */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {allImages.map((imageUrl, index) => {
            const selected = isSelected(imageUrl);
            const canSelect = selectedImages.length < maxImages || selected;
            
            return (
              <div
                key={index}
                onClick={() => canSelect && toggleImage(imageUrl)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden cursor-pointer
                  border-2 transition-all duration-200
                  ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'}
                  ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                `}
              >
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay de sélection */}
                {selected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                {/* Numéro d'ordre */}
                {selected && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="default" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                      {(selectedImages as string[]).indexOf(imageUrl) + 1}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {maxImages === 1 && selectedImages.length === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            Cliquez sur une image pour la sélectionner
          </p>
        )}
        
        {selectedImages.length >= maxImages && maxImages > 1 && (
          <p className="text-sm text-amber-600 mt-3">
            Limite de {maxImages} images atteinte. Désélectionnez une image pour en choisir une autre.
          </p>
        )}
      </CardContent>
    </Card>
  );
}