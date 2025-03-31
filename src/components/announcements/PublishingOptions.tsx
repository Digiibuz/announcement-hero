
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useDiviPixelCategories } from "@/hooks/wordpress/useDiviPixelCategories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PublishingOptionsProps {
  form: any;
  isForDiviPixel?: boolean; // Nouvel attribut pour indiquer si c'est pour DiviPixel
}

const PublishingOptions = ({ form, isForDiviPixel = false }: PublishingOptionsProps) => {
  const { user } = useAuth();
  
  // Utiliser le hook approprié en fonction du type de contenu
  const { categories: wpCategories, isLoading: wpCategoriesLoading, refetch: refetchWpCategories } = useWordPressCategories();
  const { categories: diviPixelCategories, isLoading: diviPixelCategoriesLoading, refetch: refetchDiviPixelCategories } = useDiviPixelCategories();
  
  // Sélectionner les catégories en fonction du type de contenu
  const categories = isForDiviPixel ? diviPixelCategories : wpCategories;
  const isLoadingCategories = isForDiviPixel ? diviPixelCategoriesLoading : wpCategoriesLoading;
  
  const watchStatus = form.watch("status");
  
  useEffect(() => {
    if (user?.wordpressConfigId) {
      // Charger les catégories appropriées en fonction du type de contenu
      if (isForDiviPixel) {
        refetchDiviPixelCategories();
      } else {
        refetchWpCategories();
      }
    }
  }, [user?.wordpressConfigId, isForDiviPixel]);
  
  // Vérifier si la date programmée est antérieure à aujourd'hui
  const validateScheduledDate = (date: Date | null | undefined) => {
    if (!date) return true;
    return date > new Date();
  };
  
  // Mettre à jour la validation lorsque le statut change
  useEffect(() => {
    if (watchStatus === "scheduled") {
      const currentDate = form.getValues("publishDate");
      if (!validateScheduledDate(currentDate)) {
        form.setError("publishDate", {
          type: "manual",
          message: "La date de publication doit être future"
        });
      }
    }
  }, [watchStatus]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel>Statut</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft">Brouillon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="published" id="published" />
                  <Label htmlFor="published">Publié</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled">Programmé</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchStatus === "scheduled" && (
        <FormField
          control={form.control}
          name="publishDate"
          rules={{
            required: "La date de publication est requise pour un contenu programmé",
            validate: validateScheduledDate
          }}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de publication</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="wordpressCategory"
        rules={{
          required: watchStatus !== "draft" ? "La catégorie est requise pour publier" : false
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {isForDiviPixel ? "Catégorie DiviPixel" : "Catégorie WordPress"}
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingCategories 
                      ? "Chargement des catégories..." 
                      : `Sélectionner une catégorie ${isForDiviPixel ? 'DiviPixel' : 'WordPress'}`
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories?.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {isLoadingCategories
                      ? "Chargement des catégories..."
                      : `Aucune catégorie ${isForDiviPixel ? 'DiviPixel' : 'WordPress'} disponible`}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PublishingOptions;
