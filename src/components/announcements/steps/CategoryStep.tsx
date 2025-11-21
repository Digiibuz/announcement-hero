
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
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
  const { loadForm } = useFormPersistence(form, 'announcement_category', undefined, 500);

  const {
    categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
    hasCategories,
    refetch
  } = useWordPressCategories();

  // Restaurer l'état du formulaire au chargement
  useEffect(() => {
    try {
      loadForm();
    } catch (error) {
      console.error("Error loading form:", error);
    }
  }, [loadForm]);

  // Retry logic si erreur de récupération
  useEffect(() => {
    if (categoriesError && !isCategoriesLoading) {
      const timer = setTimeout(() => {
        console.log("Tentative de récupération des catégories après erreur...");
        try {
          refetch();
        } catch (error) {
          console.error("Error refetching categories:", error);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [categoriesError, isCategoriesLoading, refetch]);

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
                  <div className="p-4 text-center">
                    <div className="text-sm text-red-600 mb-2">
                      Erreur: {String(categoriesError)}
                    </div>
                    <button 
                      onClick={() => {
                        try {
                          refetch();
                        } catch (error) {
                          console.error("Error refetching:", error);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1 mx-auto"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Réessayer
                    </button>
                  </div>
                ) : hasCategories && Array.isArray(categories) ? (
                  categories.map(category => {
                    if (!category || !category.id) return null;
                    return (
                      <SelectItem 
                        key={category.id} 
                        value={String(category.id)}
                        className="py-3 px-4 hover:bg-gray-50 focus:bg-brand-orange/10 text-base"
                      >
                        {category.name || 'Sans nom'}
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm">
                    <p className="text-muted-foreground mb-2">Aucune catégorie disponible</p>
                    <button 
                      onClick={() => {
                        try {
                          refetch();
                        } catch (error) {
                          console.error("Error refetching:", error);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1 mx-auto"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Rafraîchir
                    </button>
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
