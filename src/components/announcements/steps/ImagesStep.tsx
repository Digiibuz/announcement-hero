
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
          Médias
        </h3>
        <p className="text-gray-600">
          Ajoutez des images ou vidéos pour illustrer votre annonce. Elles apparaîtront en bas de votre page WordPress.
        </p>
      </div>
      
      <MediaUploader form={form} />
    </div>
  );
};

export default ImagesStep;
