
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { NetworkAwareImageUploader } from "../image-uploader";

interface ImagesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const ImagesStep = ({
  form,
  isMobile
}: ImagesStepProps) => {
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card className={getCardStyles()}>
        <CardContent className={`${isMobile ? "px-0 py-4" : "p-6"}`}>
          <NetworkAwareImageUploader form={form} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ImagesStep;
