
import React, { useState, useEffect } from "react";
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
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  useEffect(() => {
    // Mettre à jour les compteurs de caractères lors de l'initialisation et des changements
    const title = form.getValues("title") || "";
    const description = form.getValues("description") || "";
    setTitleLength(title.length);
    setDescriptionLength(description.length);
    
    const subscription = form.watch((value) => {
      if (value.title !== undefined) {
        setTitleLength(value.title.length);
      }
      if (value.description !== undefined) {
        setDescriptionLength(value.description.length);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-4 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <FormField 
            control={form.control} 
            name="title" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <div className="space-y-1">
                    <Input 
                      placeholder="Entrez le titre de l'annonce" 
                      className="h-11" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        setTitleLength(e.target.value.length);
                      }}
                    />
                    <div className="character-counter">{titleLength} caractères</div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormItem>
            <DescriptionField form={form} />
            <div className="character-counter mt-1">{descriptionLength} caractères</div>
          </FormItem>
        </CardContent>
      </Card>
    </div>
  );
};

export default DescriptionStep;
