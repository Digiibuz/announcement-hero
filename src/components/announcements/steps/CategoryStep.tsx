
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface CategoryStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const CategoryStep = ({
  form,
  isMobile
}: CategoryStepProps) => {
  const { loadForm } = useFormPersistence(form, 'announcement_category', undefined, 500);
  const { user } = useAuth();

  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    hasCategories,
    refetch
  } = useWordPressCategories();

  // Restaurer l'état du formulaire au chargement
  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // Retry logic si erreur de récupération
  useEffect(() => {
    if (categoriesError && !isCategoriesLoading) {
      const timer = setTimeout(() => {
        console.log("Tentative de récupération des catégories après erreur...");
        refetch();
      }, 3000); // Augmenté à 3 secondes
      
      return () => clearTimeout(timer);
    }
  }, [categoriesError, isCategoriesLoading, refetch]);

  // Message d'erreur spécifique pour les commerciaux
  const getErrorMessage = () => {
    if (!categoriesError) return null;
    
    if (user?.role === 'commercial') {
      if (categoriesError.includes("Aucune configuration WordPress assignée")) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Configuration manquante
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Votre compte commercial n'a pas encore de site WordPress assigné. 
                  Veuillez contacter votre administrateur pour qu'il vous assigne une configuration WordPress.
                </p>
                <p className="text-xs text-red-600">
                  Une fois la configuration assignée, vous pourrez créer des annonces.
                </p>
              </div>
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 mb-1">
              Erreur de connexion
            </h4>
            <p className="text-sm text-red-700 mb-3">
              {categoriesError}
            </p>
            <Button 
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {categoriesError && getErrorMessage()}
      
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
              disabled={isCategoriesLoading || !!categoriesError}
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
                      Impossible de charger les catégories
                    </div>
                    <button 
                      onClick={() => refetch()}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Réessayer
                    </button>
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
                  <div className="p-4 text-center text-sm text-muted-foreground">
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
