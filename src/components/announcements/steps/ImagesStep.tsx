
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
    <div className="space-y-4">
      {/* Gestion et organisation des images */}
      <ImageManagement form={form} isMobile={isMobile} />
    </div>
  );
};

export default ImagesStep;
