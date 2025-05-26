
import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, MapPin, Target, Zap } from "lucide-react";
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
    
    // For description, strip HTML tags to get more accurate character count
    const strippedDescription = description.replace(/<[^>]*>/g, '');
    setDescriptionLength(strippedDescription.length);
    
    const subscription = form.watch((value) => {
      if (value.title !== undefined) {
        setTitleLength(value.title.length);
      }
      if (value.description !== undefined) {
        // Strip HTML tags for character count
        const strippedDesc = value.description.replace(/<[^>]*>/g, '');
        setDescriptionLength(strippedDesc.length);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Conseils pour le titre */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="font-medium mb-2">Structure recommandée pour un titre efficace :</div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span><strong>Action ou Question</strong> + <strong>Produit/Service</strong> + <strong>Spécificité</strong> + <strong>Géolocalisation</strong></span>
            </div>
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded mt-2">
              <Target className="h-3 w-3" />
              <span className="font-medium">Exemple :</span>
              <span>"Création d'une piscine béton en carrelage bali à Perpignan"</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

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
                      placeholder="Ex: Création d'une piscine béton en carrelage bali à Perpignan" 
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

      {/* Conseils pour la description */}
      <Alert className="border-green-200 bg-green-50">
        <MapPin className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="font-medium mb-2">Conseils pour une description optimisée :</div>
          <div className="text-sm space-y-2">
            <div>• <strong>Détaillez votre offre :</strong> Spécifications techniques, matériaux, dimensions</div>
            <div>• <strong>Mentionnez votre zone d'intervention :</strong> Ville, département, rayon d'action</div>
            <div>• <strong>Ajoutez vos atouts :</strong> Expérience, certifications, garanties</div>
            <div>• <strong>Incluez un appel à l'action :</strong> "Contactez-nous pour un devis gratuit"</div>
            <div>• <strong>Utilisez des mots-clés locaux :</strong> Noms de quartiers, monuments connus</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DescriptionStep;
