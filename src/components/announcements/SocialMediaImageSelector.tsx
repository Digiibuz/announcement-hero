import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";

interface SocialMediaImageSelectorProps {
  form: UseFormReturn<AnnouncementFormData>;
}

interface ImageItem {
  url: string;
  selected: boolean;
  order: number;
}

export default function SocialMediaImageSelector({ form }: SocialMediaImageSelectorProps) {
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const watchedValues = form.watch();
  const { images = [], additionalMedias = [] } = watchedValues;

  // Combiner toutes les images
  const allImages = [...(images || []), ...(additionalMedias || [])];

  // Initialiser les items d'images
  useEffect(() => {
    if (allImages.length > 0) {
      setImageItems(prevItems => {
        // Créer un map des items existants pour préserver l'état
        const existingItemsMap = new Map(prevItems.map(item => [item.url, item]));
        
        return allImages.map((url, index) => {
          const existingItem = existingItemsMap.get(url);
          return existingItem || {
            url,
            selected: true, // Par défaut, toutes les images sont sélectionnées
            order: index
          };
        });
      });
    }
  }, [allImages]);

  const handleCheckboxChange = (imageUrl: string, checked: boolean) => {
    setImageItems(prev => 
      prev.map(item => 
        item.url === imageUrl ? { ...item, selected: checked } : item
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setImageItems(prev => {
      const newItems = [...prev];
      const draggedItem = newItems[draggedIndex];
      
      // Supprimer l'élément de sa position actuelle
      newItems.splice(draggedIndex, 1);
      
      // L'insérer à la nouvelle position
      newItems.splice(dropIndex, 0, draggedItem);
      
      // Mettre à jour les ordres
      return newItems.map((item, index) => ({
        ...item,
        order: index
      }));
    });
    
    setDraggedIndex(null);
  };

  const selectedImages = imageItems.filter(item => item.selected);
  const coverImage = selectedImages.length > 0 ? selectedImages[0] : null;

  if (allImages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images sélectionnées ({selectedImages.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Glissez-déposez pour réorganiser. La première image sera l'image de couverture.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Grille des images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageItems.map((item, index) => (
              <div
                key={item.url}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  relative group cursor-move border-2 rounded-lg overflow-hidden transition-all duration-200
                  ${item.selected ? 'border-primary' : 'border-muted'}
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                  hover:shadow-md
                `}
              >
                {/* Numéro d'ordre */}
                {item.selected && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {selectedImages.findIndex(si => si.url === item.url) + 1}
                      {index === 0 && selectedImages.includes(item) && (
                        <span className="ml-1">👑</span>
                      )}
                    </Badge>
                  </div>
                )}

                {/* Icône de glissement */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="absolute bottom-2 left-2 z-10">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(item.url, checked as boolean)
                    }
                    className="bg-white border-2"
                  />
                </div>

                {/* Image */}
                <div className="aspect-square bg-muted">
                  <img
                    src={item.url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Overlay pour les images non sélectionnées */}
                {!item.selected && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      Non incluse
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Informations sur l'image de couverture */}
          {coverImage && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Image de couverture :</span>
                <span className="text-muted-foreground">
                  La première image sera utilisée comme image principale pour les réseaux sociaux
                </span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Cochez les images que vous souhaitez inclure dans la publication</p>
            <p>• Glissez-déposez pour changer l'ordre des images</p>
            <p>• La première image (👑) sera l'image de couverture</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}