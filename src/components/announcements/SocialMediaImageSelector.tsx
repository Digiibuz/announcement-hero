import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Check, Upload, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const addImageInputRef = useRef<HTMLInputElement>(null);
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
    if (!file) return;

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

      // If replacing an existing image
      if (replacingIndex !== null) {
        const imageCount = images?.length || 0;
        const oldImageUrl = allImages[replacingIndex];
        
        if (replacingIndex < imageCount) {
          const newImages = [...(images || [])];
          newImages[replacingIndex] = publicUrl;
          form.setValue('images', newImages);
        } else {
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
      } else {
        // Adding a new image
        const newMedias = [...(additionalMedias || []), publicUrl];
        form.setValue('additionalMedias', newMedias);
        toast.success("Image ajoutée avec succès");
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
      setReplacingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (addImageInputRef.current) {
        addImageInputRef.current.value = '';
      }
    }
  };

  const handleAddImageClick = () => {
    setReplacingIndex(null);
    addImageInputRef.current?.click();
  };

  if (allImages.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedImages.length > 0 
                ? `${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} sélectionnée${selectedImages.length > 1 ? 's' : ''}`
                : "Sélectionnez vos meilleures images"}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          {selectedImages.length}/{maxImages}
        </Badge>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Card "Ajouter une image" */}
        <button
          onClick={handleAddImageClick}
          disabled={isUploading && replacingIndex === null}
          className={cn(
            "relative aspect-square rounded-2xl overflow-hidden transition-all duration-300",
            "border-2 border-dashed border-muted-foreground/30",
            "hover:border-primary hover:bg-primary/5",
            "flex flex-col items-center justify-center gap-3",
            "group cursor-pointer",
            isUploading && replacingIndex === null && "opacity-50 cursor-wait"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            {isUploading && replacingIndex === null ? (
              <div className="h-6 w-6 border-2 border-t-transparent border-primary rounded-full animate-spin" />
            ) : (
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Ajouter une image
          </span>
        </button>

        {/* Images existantes */}
        {allImages.map((imageUrl, index) => {
          const selected = isSelected(imageUrl);
          const canSelect = selectedImages.length < maxImages || selected;
          
          return (
            <div
              key={index}
              className="relative aspect-square rounded-2xl overflow-hidden group"
            >
              <div
                onClick={() => canSelect && toggleImage(imageUrl)}
                className={cn(
                  "w-full h-full cursor-pointer relative",
                  "border-2 transition-all duration-300 rounded-2xl overflow-hidden",
                  selected 
                    ? "border-primary ring-4 ring-primary/20 scale-95" 
                    : "border-transparent hover:border-muted-foreground/30",
                  !canSelect && "opacity-50 cursor-not-allowed"
                )}
              >
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* Overlay gradient au survol */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                )} />
                
                {/* Overlay de sélection */}
                {selected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-primary shadow-lg flex items-center justify-center animate-in zoom-in duration-300">
                      <Check className="h-7 w-7 text-primary-foreground stroke-[3]" />
                    </div>
                  </div>
                )}
                
                {/* Numéro d'ordre */}
                {selected && (
                  <div className="absolute top-3 right-3">
                    <div className="h-8 w-8 rounded-full bg-primary shadow-lg flex items-center justify-center font-bold text-sm text-primary-foreground">
                      {(selectedImages as string[]).indexOf(imageUrl) + 1}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton Remplacer */}
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplaceClick(index);
                }}
                disabled={isUploading && replacingIndex === index}
                className="absolute top-3 left-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                title="Remplacer l'image"
              >
                {isUploading && replacingIndex === index ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
      
      {allImages.length === 0 && (
        <div className="text-center py-12">
          <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Aucune image disponible. Commencez par ajouter une image.
          </p>
        </div>
      )}
      
      {selectedImages.length >= maxImages && maxImages > 1 && (
        <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
            Limite de {maxImages} images atteinte. Désélectionnez une image pour en choisir une autre.
          </p>
        </div>
      )}
    </div>
  );
}