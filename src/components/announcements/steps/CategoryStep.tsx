
import React, { useEffect, useState } from "react";
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
  
  const [selectOpen, setSelectOpen] = useState(false);

  // Restaurer l'état du formulaire au chargement
  useEffect(() => {
    try {
      loadForm();
    } catch (error) {
      console.error("Error loading form:", error);
    }
  }, [loadForm]);

  // Retry automatique plus agressif au montage du composant
  useEffect(() => {
    if (!isCategoriesLoading && !hasCategories && !categoriesError) {
      console.log("No categories on mount, triggering initial fetch");
      refetch();
    }
  }, []); // Uniquement au montage

  // Retry automatique si le select est ouvert sans catégories
  useEffect(() => {
    if (selectOpen && !isCategoriesLoading && (!hasCategories || categoriesError)) {
      console.log("Select opened without categories or with error, retrying...");
      const retryTimer = setTimeout(() => {
        refetch();
      }, 300);
      return () => clearTimeout(retryTimer);
    }
  }, [selectOpen, hasCategories, categoriesError, isCategoriesLoading, refetch]);

  // Retry périodique si pas de catégories après 2 secondes
  useEffect(() => {
    if (!hasCategories && !isCategoriesLoading && !categoriesError) {
      console.log("Still no categories after mount, scheduling retry...");
      const retryTimer = setTimeout(() => {
        console.log("Executing scheduled retry");
        refetch();
      }, 2000);
      return () => clearTimeout(retryTimer);
    }
  }, [hasCategories, isCategoriesLoading, categoriesError, refetch]);

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
              open={selectOpen}
              onOpenChange={setSelectOpen}
            >
              <FormControl>
                <SelectTrigger className="h-14 text-base border-2 border-gray-200 focus:border-brand-orange rounded-xl bg-gray-50 hover:bg-white transition-all duration-200" id="category-select">
                  <SelectValue placeholder={
                    isCategoriesLoading 
                      ? "Chargement des catégories..." 
                      : categoriesError 
                      ? "Erreur de chargement - Cliquez pour réessayer"
                      : !hasCategories
                      ? "Chargement des catégories en cours..."
                      : "Sélectionnez une catégorie"
                  } />
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
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
                ) : !hasCategories ? (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Chargement des catégories...</span>
                    </div>
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
                ) : null}
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
