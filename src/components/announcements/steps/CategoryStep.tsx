
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { NetworkAwareLoading } from "@/components/ui/network-aware-loading";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    hasCategories,
    refetch
  } = useWordPressCategories();

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
            render={({ field }) => (
              <FormItem className="mb-0">
                <FormLabel>Sélectionner une catégorie</FormLabel>
                
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  disabled={isCategoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <NetworkAwareLoading 
                      isLoading={isCategoriesLoading}
                      minDelay={100}
                      showSlowNetworkWarning={true}
                      slowNetworkMessage="Connexion lente détectée. Récupération des catégories optimisée en cours..."
                      loadingMessage="Chargement des catégories..."
                      variant="dots"
                      size={16}
                      className="py-3"
                    >
                      {categoriesError ? (
                        <div className="p-3 text-center space-y-2">
                          <div className="flex items-center justify-center text-amber-500 mb-2">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Erreur lors du chargement des catégories
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => refetch()}
                            className="text-xs"
                          >
                            Réessayer
                          </Button>
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
                    </NetworkAwareLoading>
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
