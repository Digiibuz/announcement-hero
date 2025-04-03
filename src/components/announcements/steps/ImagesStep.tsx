
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import ImageUploader from "../ImageUploader";

interface ImagesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const ImagesStep = ({ form, isMobile }: ImagesStepProps) => {
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Ajoutez des images</h2>
        <p className="text-muted-foreground">
          Les annonces avec des images de qualité attirent davantage l'attention et génèrent plus d'intérêt.
        </p>
      </div>
      
      <Card className={getCardStyles()}>
        <CardContent className={`${isMobile ? "px-0 py-4" : "p-6"}`}>
          <ImageUploader form={form} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ImagesStep;
