
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";

interface CategoryStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const CategoryStep = ({
  form,
  isMobile
}: CategoryStepProps) => {
  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    hasCategories
  } = useWordPressCategories();

  // Logs de debug pour comprendre l'état
  useEffect(() => {
    console.log("CategoryStep - Debug info:", {
      categories: categories,
      categoriesLength: categories?.length,
      isLoading: isCategoriesLoading,
      error: categoriesError,
      hasCategories: hasCategories,
      currentValue: form.getValues().wordpressCategory
    });
  }, [categories, isCategoriesLoading, categoriesError, hasCategories, form]);

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
          <FormField 
            control={form.control} 
            name="wordpressCategory" 
            render={({field}) => (
              <FormItem className="mb-0">
                <FormLabel>Sélectionner une catégorie</FormLabel>
                
                <Select 
                  onValueChange={(value) => {
                    console.log("CategoryStep - Category selected:", value);
                    field.onChange(value);
                  }} 
                  value={field.value || ""}
                  disabled={isCategoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-12" id="category-select">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                        <SelectItem key={category.id} value={String(category.id)}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryStep;
