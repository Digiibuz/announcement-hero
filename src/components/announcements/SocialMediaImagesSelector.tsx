import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Image as ImageIcon } from "lucide-react";
import { AnnouncementFormData } from "./AnnouncementForm";
import DraggableMediaGrid from "./DraggableMediaGrid";

interface SocialMediaImagesSelectorProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const SocialMediaImagesSelector: React.FC<SocialMediaImagesSelectorProps> = ({ form }) => {
  const watchedValues = form.watch();
  const { images, additionalMedias } = watchedValues;
  
  // Combine all medias (main image + additional medias)
  const allMedias = [
    ...(images || []),
    ...(additionalMedias || [])
  ].filter(Boolean);

  // State for selected medias for social networks
  const [selectedMedias, setSelectedMedias] = useState<string[]>(allMedias);

  // Update selected medias when form data changes
  useEffect(() => {
    setSelectedMedias(allMedias);
  }, [images, additionalMedias]);

  const handleToggleMedia = (mediaUrl: string) => {
    setSelectedMedias(prev => {
      if (prev.includes(mediaUrl)) {
        return prev.filter(url => url !== mediaUrl);
      } else {
        return [...prev, mediaUrl];
      }
    });
  };

  const handleReorderSelectedMedias = (newOrder: string[]) => {
    setSelectedMedias(newOrder);
  };

  const removeFromSelection = (index: number) => {
    const mediaToRemove = selectedMedias[index];
    setSelectedMedias(prev => prev.filter(url => url !== mediaToRemove));
  };

  if (allMedias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Images sélectionnées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune image n'a été ajoutée.</p>
            <p className="text-sm">Retournez à l'étape "Images" pour ajouter des médias.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images pour les réseaux sociaux ({selectedMedias.length}/{allMedias.length})
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline" className="text-xs">
            1ère = Image de couverture
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section de sélection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Choisir les images à publier :</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allMedias.map((mediaUrl, index) => {
              const isSelected = selectedMedias.includes(mediaUrl);
              const isMainImage = index === 0 && images && images.length > 0;
              
              return (
                <div key={index} className="relative">
                  <div 
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleMedia(mediaUrl)}
                  >
                    <img
                      src={mediaUrl}
                      alt={`Média ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleMedia(mediaUrl)}
                        className="bg-white"
                      />
                    </div>
                    
                    {/* Badge pour image principale */}
                    {isMainImage && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          Principale
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section de réorganisation */}
        {selectedMedias.length > 0 && (
          <div className="space-y-3">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Ordre de publication :</h4>
              <DraggableMediaGrid
                mediaUrls={selectedMedias}
                onReorder={handleReorderSelectedMedias}
                onRemove={removeFromSelection}
                maxItems={selectedMedias.length}
              />
            </div>
          </div>
        )}

        {selectedMedias.length === 0 && (
          <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p>Aucune image sélectionnée pour les réseaux sociaux.</p>
            <p className="text-sm">Cochez les images que vous souhaitez publier.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaImagesSelector;