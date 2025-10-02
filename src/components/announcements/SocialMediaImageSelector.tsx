import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical, Check } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";

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

  if (allImages.length === 0) {
    return null;
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
      <CardContent>
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