
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../AnnouncementForm";
import MediaUploader from "../MediaUploader";

interface ImagesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile: boolean;
}

const ImagesStep = ({ form, isMobile }: ImagesStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Images et Vidéos
        </h3>
        <p className="text-gray-600">
          Ajoutez une image ou vidéo pour illustrer votre annonce et attirer plus d'attention.
        </p>
      </div>
      
      <MediaUploader form={form} />
      
      <div className="text-sm text-gray-500 text-center">
        <p>• Formats supportés : JPEG, PNG, WebP, HEIC, MP4, MOV</p>
        <p>• Taille maximale : 10 MB par fichier</p>
        <p>• Une seule image ou vidéo par annonce</p>
      </div>
    </div>
  );
};

export default ImagesStep;
