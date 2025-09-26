
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../AnnouncementForm";
import MediaUploader from "../MediaUploader";
import AdditionalMediaUploader from "../AdditionalMediaUploader";
import ImageManagement from "../ImageManagement";

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
          Ajoutez et organisez vos images pour créer une annonce attrayante.
        </p>
      </div>
      
      {/* Gestion et organisation des images */}
      <ImageManagement form={form} />
    </div>
  );
};

export default ImagesStep;
