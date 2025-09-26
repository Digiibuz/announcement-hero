
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../AnnouncementForm";
import MediaUploader from "../MediaUploader";
import AdditionalMediaUploader from "../AdditionalMediaUploader";

interface ImagesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile: boolean;
}

const ImagesStep = ({ form, isMobile }: ImagesStepProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Images et vidéos
        </h3>
        <p className="text-gray-600">
          Ajoutez une image principale (obligatoire) et des médias additionnels (optionnel) pour enrichir votre annonce.
        </p>
      </div>
      
      {/* Image principale */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Image principale</h4>
        <MediaUploader form={form} />
        <div className="text-sm text-gray-500">
          <p>• Cette image sera mise en avant dans votre annonce</p>
          <p>• Formats supportés : JPEG, PNG, WebP, HEIC</p>
          <p>• Taille maximale : 10 MB</p>
        </div>
      </div>

      {/* Médias additionnels */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Médias additionnels (optionnel)</h4>
        <AdditionalMediaUploader form={form} />
        <div className="text-sm text-gray-500">
          <p>• Ajoutez jusqu'à 5 images ou vidéos supplémentaires</p>
          <p>• Formats supportés : JPEG, PNG, WebP, MP4, MOV</p>
          <p>• Taille maximale : 10 MB par fichier</p>
          <p>• Ces médias enrichiront votre annonce et amélioreront son attrait visuel</p>
        </div>
      </div>
    </div>
  );
};

export default ImagesStep;
