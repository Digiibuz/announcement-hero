import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Check, Upload, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  
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

  const handleReplaceClick = (index: number) => {
    setReplacingIndex(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || replacingIndex === null) return;

    setIsUploading(true);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { data, error } = await supabase.storage
        .from('announcement-images')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('announcement-images')
        .getPublicUrl(filePath);

      // Determine which array the image belongs to
      const imageCount = images?.length || 0;
      const oldImageUrl = allImages[replacingIndex];
      
      if (replacingIndex < imageCount) {
        // Replace in images array
        const newImages = [...(images || [])];
        newImages[replacingIndex] = publicUrl;
        form.setValue('images', newImages);
      } else {
        // Replace in additionalMedias array
        const newMedias = [...(additionalMedias || [])];
        newMedias[replacingIndex - imageCount] = publicUrl;
        form.setValue('additionalMedias', newMedias);
      }

      // Update selected images if the old image was selected
      const currentSelected = selectedImages as string[];
      if (currentSelected.includes(oldImageUrl)) {
        const updatedSelected = currentSelected.map(url => 
          url === oldImageUrl ? publicUrl : url
        );
        form.setValue(fieldName, updatedSelected);
      }

      toast.success("Image remplacée avec succès");
    } catch (error) {
      console.error('Error replacing image:', error);
      toast.error("Erreur lors du remplacement de l'image");
    } finally {
      setIsUploading(false);
      setReplacingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {allImages.map((imageUrl, index) => {
            const selected = isSelected(imageUrl);
            const canSelect = selectedImages.length < maxImages || selected;
            
            return (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <div
                  onClick={() => canSelect && toggleImage(imageUrl)}
                  className={`
                    w-full h-full cursor-pointer
                    border-2 transition-all duration-200 rounded-lg overflow-hidden
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
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  
                  {/* Numéro d'ordre */}
                  {selected && (
                    <div className="absolute top-1 right-1 pointer-events-none">
                      <Badge variant="default" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                        {(selectedImages as string[]).indexOf(imageUrl) + 1}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Bouton Remplacer - Toujours visible */}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplaceClick(index);
                  }}
                  disabled={isUploading && replacingIndex === index}
                  className="absolute top-1 left-1 h-7 w-7 rounded-full shadow-md z-10"
                  title="Remplacer l'image"
                >
                  {isUploading && replacingIndex === index ? (
                    <div className="h-3 w-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                </Button>
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