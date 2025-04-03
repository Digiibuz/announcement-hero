
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import DescriptionField from "../DescriptionField";

interface DescriptionStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const DescriptionStep = ({ form, isMobile }: DescriptionStepProps) => {
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Décrivez votre annonce</h2>
        <p className="text-muted-foreground">
          Donnez un titre accrocheur et une description détaillée pour attirer l'attention des lecteurs.
        </p>
      </div>
      
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-4 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <FormField 
            control={form.control} 
            name="title" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Entrez le titre de l'annonce" 
                    className="h-11" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <DescriptionField form={form} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DescriptionStep;
