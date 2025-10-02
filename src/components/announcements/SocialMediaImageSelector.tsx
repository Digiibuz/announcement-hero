import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, GripVertical, Check, Pencil, Sparkles } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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
  
  const handleEditImage = async () => {
    if (!editingImage || !editPrompt.trim()) {
      toast.error("Veuillez saisir une instruction");
      return;
    }
    
    setIsEditing(true);
    
    try {
      // Appel à l'edge function pour éditer l'image avec l'IA
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          imageUrl: editingImage,
          prompt: editPrompt
        }
      });
      
      if (error) throw error;
      
      if (data?.editedImageUrl) {
        // Remplacer l'image dans les tableaux
        const updatedImages = images.map((img: string) => 
          img === editingImage ? data.editedImageUrl : img
        );
        const updatedAdditionalMedias = additionalMedias.map((img: string) => 
          img === editingImage ? data.editedImageUrl : img
        );
        
        form.setValue('images', updatedImages);
        form.setValue('additionalMedias', updatedAdditionalMedias);
        
        // Mettre à jour les images sélectionnées si l'image éditée était sélectionnée
        if (isSelected(editingImage)) {
          const updatedSelected = (selectedImages as string[]).map((img: string) => 
            img === editingImage ? data.editedImageUrl : img
          );
          form.setValue(fieldName, updatedSelected);
        }
        
        toast.success("Image éditée avec succès !");
        setEditingImage(null);
        setEditPrompt("");
      }
    } catch (error) {
      console.error('Error editing image:', error);
      toast.error("Erreur lors de l'édition de l'image");
    } finally {
      setIsEditing(false);
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {allImages.map((imageUrl, index) => {
            const selected = isSelected(imageUrl);
            const canSelect = selectedImages.length < maxImages || selected;
            
            return (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 group"
                style={{
                  borderColor: selected ? 'hsl(var(--primary))' : 'transparent'
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onClick={() => canSelect && toggleImage(imageUrl)}
                />
                
                {/* Bouton éditer - toujours visible au hover */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingImage(imageUrl);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                
                {/* Overlay de sélection */}
                {selected && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                    onClick={() => canSelect && toggleImage(imageUrl)}
                  >
                    <div className="rounded-full p-1" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                      <Check className="h-4 w-4" style={{ color: 'hsl(var(--primary-foreground))' }} />
                    </div>
                  </div>
                )}
                
                {/* Numéro d'ordre */}
                {selected && (
                  <div className="absolute top-1 left-1">
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
      
      {/* Dialog d'édition d'image */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Modifier l'image avec l'IA
            </DialogTitle>
            <DialogDescription>
              Décrivez comment vous souhaitez modifier l'image (ex: "rendre plus lumineux", "ajouter un ciel bleu", "style cartoon", etc.)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingImage && (
              <div className="relative w-full max-h-64 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={editingImage} 
                  alt="Image à éditer" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-prompt">Instruction de modification</Label>
              <Input
                id="edit-prompt"
                placeholder="Ex: rendre plus lumineux et ajouter des couleurs vives"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditing) {
                    handleEditImage();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingImage(null);
                setEditPrompt("");
              }}
              disabled={isEditing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditImage}
              disabled={isEditing || !editPrompt.trim()}
            >
              {isEditing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Édition en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Modifier l'image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}