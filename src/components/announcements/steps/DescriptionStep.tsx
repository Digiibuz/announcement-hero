
import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, MapPin, Target, Zap, HelpCircle } from "lucide-react";
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
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-4 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <div className="flex items-center justify-between">
            <FormLabel>Titre et Description</FormLabel>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Conseils de rédaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    Conseils pour optimiser vos annonces
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Conseils pour le titre */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div className="font-medium mb-3">Structure recommandée pour un titre efficace :</div>
                      <div className="text-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3" />
                          <span><strong>Action ou Question</strong> + <strong>Produit/Service</strong> + <strong>Spécificité</strong> + <strong>Géolocalisation</strong></span>
                        </div>
                        <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded">
                          <Target className="h-3 w-3 mt-0.5" />
                          <div>
                            <span className="font-medium">Exemple :</span>
                            <div className="mt-1 italic">"Création d'une piscine béton en carrelage bali à Perpignan"</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-25 p-2 rounded">
                          <strong>Pourquoi cette structure ?</strong> Elle permet de référencer vos annonces de façon géolocalisée et d'augmenter votre référencement SEO de manière très puissante.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Conseils pour la description */}
                  <Alert className="border-green-200 bg-green-50">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="font-medium mb-3">Conseils pour une description optimisée :</div>
                      <div className="text-sm space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <div><strong>Détaillez votre offre :</strong> Spécifications techniques, matériaux, dimensions</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <div><strong>Mentionnez votre zone d'intervention :</strong> Ville, département, rayon d'action</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <div><strong>Ajoutez vos atouts :</strong> Expérience, certifications, garanties</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <div><strong>Incluez un appel à l'action :</strong> "Contactez-nous pour un devis gratuit"</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <div><strong>Utilisez des mots-clés locaux :</strong> Noms de quartiers, monuments connus</div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Conseils SEO supplémentaires */}
                  <Alert className="border-purple-200 bg-purple-50">
                    <Target className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <div className="font-medium mb-2">Avantages SEO de cette approche :</div>
                      <div className="text-sm space-y-1">
                        <div>✓ Améliore le référencement local</div>
                        <div>✓ Augmente la visibilité sur les moteurs de recherche</div>
                        <div>✓ Attire une clientèle géographiquement ciblée</div>
                        <div>✓ Optimise le taux de conversion</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
    </div>
  );
};

export default DescriptionStep;
