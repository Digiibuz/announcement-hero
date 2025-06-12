
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressConfigCategories } from "@/hooks/wordpress/useWordPressConfigCategories";
import { DipiCptCategorySelection } from "@/types/wordpress-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategorySelectionProps {
  configId: string;
  configName: string;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ configId, configName }) => {
  const [categoriesSelection, setCategoriesSelection] = useState<DipiCptCategorySelection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { categories, isLoading: categoriesLoading, refetch } = useWordPressCategories();
  const { 
    isLoading: configCategoriesLoading, 
    isSubmitting, 
    fetchConfigCategories, 
    saveConfigCategories 
  } = useWordPressConfigCategories();

  // Charger les catégories sélectionnées pour cette config
  useEffect(() => {
    const loadConfigCategories = async () => {
      if (configId && categories.length > 0) {
        const savedCategories = await fetchConfigCategories(configId);
        const savedCategoryIds = new Set(savedCategories.map(cat => cat.category_id));
        
        const selection = categories.map(category => ({
          id: String(category.id),
          name: category.name,
          selected: savedCategoryIds.has(String(category.id))
        }));
        
        setCategoriesSelection(selection);
        setHasChanges(false);
      }
    };

    loadConfigCategories();
  }, [configId, categories, fetchConfigCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    setCategoriesSelection(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, selected: !cat.selected }
          : cat
      )
    );
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const allSelected = categoriesSelection.every(cat => cat.selected);
    setCategoriesSelection(prev => 
      prev.map(cat => ({ ...cat, selected: !allSelected }))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    const selectedCategories = categoriesSelection
      .filter(cat => cat.selected)
      .map(cat => ({ id: cat.id, name: cat.name }));

    await saveConfigCategories(configId, selectedCategories);
    setHasChanges(false);
  };

  const isLoading = categoriesLoading || configCategoriesLoading;
  const selectedCount = categoriesSelection.filter(cat => cat.selected).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des catégories...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Aucune catégorie DipiPixel trouvée pour cette configuration.
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Catégories DipiPixel disponibles</span>
          <span className="text-sm font-normal text-muted-foreground">
            {selectedCount} / {categoriesSelection.length} sélectionnées
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleSelectAll} 
            variant="outline" 
            size="sm"
          >
            {categoriesSelection.every(cat => cat.selected) ? 'Désélectionner tout' : 'Sélectionner tout'}
          </Button>
        </div>

        <ScrollArea className="h-64 border rounded-md p-4">
          <div className="space-y-3">
            {categoriesSelection.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={category.selected}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label 
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>

        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySelection;
