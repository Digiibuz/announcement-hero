import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical, Crown, Upload, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import MediaUploader from "./MediaUploader";
import AdditionalMediaUploader from "./AdditionalMediaUploader";

interface ImageManagementProps {
  form: UseFormReturn<AnnouncementFormData>;
}

interface ImageItem {
  url: string;
  selected: boolean;
  id: string;
  type: 'main' | 'additional';
}

export default function ImageManagement({ form }: ImageManagementProps) {
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
          const isMainImage = images.includes(url);
          return existingItem || {
            url,
            selected: true,
            id: `img-${index}-${url.substring(url.length - 10)}`,
            type: isMainImage ? 'main' : 'additional' as 'main' | 'additional'
          };
        });
      });
    }
  }, [allImages.join(','), images.join(',')]);

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
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
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
    setImageItems(prev => {
      const draggedIndex = prev.findIndex(item => item.id === draggedId);
      const targetIndex = prev.findIndex(item => item.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return prev;
      }
      
      const newItems = [...prev];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      
      return newItems;
    });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    moveItem(draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
  };

  const selectedImages = imageItems.filter(item => item.selected);
  const mainImage = selectedImages.find(item => item.type === 'main');
  const firstSelectedImage = selectedImages[0];

  if (allImages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gestion des images ({selectedImages.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ajoutez vos images puis organisez-les par ordre d'importance.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bouton d'ajout d'images */}
          <div 
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/20 transition-all duration-200 cursor-pointer group"
            onClick={() => {
              // Trigger le click sur l'input file caché
              document.getElementById('image-upload-input')?.click();
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
                  Ajouter des images
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, HEIC - Max 10 MB par fichier
                </p>
              </div>
            </div>
            
            {/* Input file caché */}
            <input
              id="image-upload-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                // Ici on gérera l'upload des fichiers
                console.log("Files selected:", e.target.files);
              }}
            />
          </div>

          {/* Section organisation (seulement si des images existent) */}
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
                {/* Badge d'ordre et statut */}
                <div className="absolute top-2 left-2 z-10 flex gap-1">
                  {item.selected && (
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="text-xs flex items-center gap-1"
                    >
                      {selectedImages.findIndex(si => si.id === item.id) + 1}
                      {index === 0 && (
                        <Crown className="h-3 w-3" />
                      )}
                    </Badge>
                  )}
                  
                  {item.type === 'main' && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Principal
                    </Badge>
                  )}
                </div>

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
                      Non utilisée
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Informations sur l'organisation */}
          {selectedImages.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Image principale :</span>
                <span className="text-muted-foreground">
                  {firstSelectedImage ? 
                    `Image ${selectedImages.indexOf(firstSelectedImage) + 1} sera l'image de couverture` :
                    "Aucune image sélectionnée"
                  }
                </span>
              </div>
              
              {mainImage && firstSelectedImage?.id !== mainImage.id && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ L'image marquée "Principal" n'est pas en première position. 
                  La première image dans l'ordre sera utilisée comme couverture.
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-900 mb-1">💡 Instructions :</p>
            <p>• Cochez les images que vous souhaitez utiliser</p>
            <p>• Glissez-déposez pour changer l'ordre d'importance</p>
            <p>• La première image (👑) sera l'image de couverture principale</p>
            <p>• Les autres images apparaîtront comme images additionnelles</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}