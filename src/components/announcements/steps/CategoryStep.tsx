
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useFormPersistence } from "@/hooks/useFormPersistence";

interface CategoryStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const CategoryStep = ({
  form,
  isMobile
}: CategoryStepProps) => {
  // Utiliser le hook de persistance pour sauvegarder/restaurer les données du formulaire
  const { loadForm } = useFormPersistence(form, 'announcement_category', undefined, 500);

  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    hasCategories
  } = useWordPressCategories();

  // Restaurer l'état du formulaire au chargement
  useEffect(() => {
    loadForm();
  }, [loadForm]);

  return (
    <div className="space-y-6">
      <FormField 
        control={form.control} 
        name="wordpressCategory" 
        render={({field}) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-700">Sélectionner une catégorie</FormLabel>
            
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value} 
              value={field.value}
              disabled={isCategoriesLoading}
            >
              <FormControl>
                <SelectTrigger className="h-14 text-base border-2 border-gray-200 focus:border-brand-orange rounded-xl bg-gray-50 hover:bg-white transition-all duration-200" id="category-select">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                {isCategoriesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Chargement des catégories...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Erreur: {categoriesError}
                  </div>
                ) : hasCategories ? (
                  categories.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={String(category.id)}
                      className="py-3 px-4 hover:bg-gray-50 focus:bg-brand-orange/10 text-base"
                    >
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Aucune catégorie disponible
                  </div>
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

export default CategoryStep;
