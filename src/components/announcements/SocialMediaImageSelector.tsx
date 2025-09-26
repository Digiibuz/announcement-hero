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
  id: string; // Utiliser un ID unique au lieu de l'index
}

export default function SocialMediaImageSelector({ form }: SocialMediaImageSelectorProps) {
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const watchedValues = form.watch();
  const { images = [], additionalMedias = [] } = watchedValues;

  // Combiner toutes les images
  const allImages = [...(images || []), ...(additionalMedias || [])];

  // Initialiser les items d'images
  useEffect(() => {
    if (allImages.length > 0) {
      setImageItems(prevItems => {
        // Si on a déjà des items avec les mêmes URLs, ne pas réinitialiser
        if (prevItems.length === allImages.length && 
            prevItems.every(item => allImages.includes(item.url))) {
          return prevItems;
        }
        
        // Créer un map des items existants pour préserver l'état
        const existingItemsMap = new Map(prevItems.map(item => [item.url, item]));
        
        return allImages.map((url, index) => {
          const existingItem = existingItemsMap.get(url);
          return existingItem || {
            url,
            selected: true, // Par défaut, toutes les images sont sélectionnées
            id: `img-${index}-${url.substring(url.length - 10)}` // ID unique
          };
        });
      });
    }
  }, [allImages.join(',')]); // Utiliser join pour éviter les re-renders inutiles

  const handleCheckboxChange = (imageUrl: string, checked: boolean) => {
    setImageItems(prev => 
      prev.map(item => 
        item.url === imageUrl ? { ...item, selected: checked } : item
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId);
    setDragOverId(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    console.log("Drag start:", itemId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    console.log("Drag end");
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedId && draggedId !== itemId) {
      setDragOverId(itemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverId(null);
    }
  };

  const moveItem = (draggedId: string, targetId: string) => {
    console.log("Moving item from", draggedId, "to", targetId);
    
    setImageItems(prev => {
      const draggedIndex = prev.findIndex(item => item.id === draggedId);
      const targetIndex = prev.findIndex(item => item.id === targetId);
      
      console.log("Indices:", { draggedIndex, targetIndex });
      
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        console.log("Invalid indices or same position");
        return prev;
      }
      
      const newItems = [...prev];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      
      console.log("New order:", newItems.map(item => item.url));
      return newItems;
    });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    console.log("Drop event:", { draggedId, targetId });
    
    if (!draggedId || draggedId === targetId) {
      console.log("Drop cancelled");
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    moveItem(draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
  };

  const selectedImages = imageItems.filter(item => item.selected);

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
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`
                  relative group cursor-move border-2 rounded-lg overflow-hidden transition-all duration-200
                  ${item.selected ? 'border-primary' : 'border-muted'}
                  ${draggedId === item.id ? 'opacity-50 scale-95' : ''}
                  ${dragOverId === item.id ? 'border-blue-500 border-dashed scale-105' : ''}
                  hover:shadow-md
                `}
              >
                {/* Numéro d'ordre */}
                {item.selected && (
                  <div className="absolute top-2 left-2" style={{ zIndex: 0 }}>
                    <Badge 
                      variant={selectedImages.findIndex(si => si.id === item.id) === 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {selectedImages.findIndex(si => si.id === item.id) + 1}
                      {selectedImages.findIndex(si => si.id === item.id) === 0 && (
                        <span className="ml-1">👑</span>
                      )}
                    </Badge>
                  </div>
                )}

                {/* Icône de glissement */}
                <div className="absolute top-2 right-2" style={{ zIndex: 0 }}>
                  <div className="bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="absolute bottom-2 left-2" style={{ zIndex: 0 }}>
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
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium">
                      Non incluse
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Informations sur l'image de couverture */}
          {selectedImages.length > 0 && (
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