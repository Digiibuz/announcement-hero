
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../AnnouncementForm";
import MediaUploader from "../MediaUploader";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface ImagesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile: boolean;
}

const ImagesStep = ({ form, isMobile }: ImagesStepProps) => {
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-6 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Ajoutez une image à votre annonce
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              L'image sera automatiquement placée en dessous de votre texte sur WordPress. 
              Une belle image attire plus d'attention et améliore l'engagement.
            </p>
          </div>
          
          <MediaUploader form={form} />
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-700 mb-2">Conseils pour vos images :</p>
              <p>• Formats supportés : JPEG, PNG, WebP, HEIC</p>
              <p>• Taille maximale : 10 MB par fichier</p>
              <p>• Une seule image par annonce</p>
              <p>• Privilégiez des images haute qualité et pertinentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImagesStep;
