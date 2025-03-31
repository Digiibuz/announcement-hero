
import React, { useState } from "react";
import { useCategoriesKeywords } from "@/hooks/tome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TomeCategoriesProps {
  configId: string;
  isClientView?: boolean;
}

const TomeCategories: React.FC<TomeCategoriesProps> = ({ configId, isClientView = false }) => {
  const { 
    categories, 
    keywords, 
    isLoading, 
    isSubmitting,
    addKeyword,
    deleteKeyword,
    getKeywordsForCategory,
    fetchKeywords
  } = useCategoriesKeywords(configId);

  const [newKeywords, setNewKeywords] = useState<Record<string, string>>({});
  const [keywordToDelete, setKeywordToDelete] = useState<string | null>(null);

  const handleAddKeyword = async (categoryId: string, categoryName: string) => {
    const keyword = newKeywords[categoryId]?.trim();
    if (!keyword) return;

    await addKeyword(categoryId, categoryName, keyword);
    // Réinitialiser le champ de saisie
    setNewKeywords({
      ...newKeywords,
      [categoryId]: ""
    });
  };

  const handleDeleteKeyword = async () => {
    if (!keywordToDelete) return;
    
    await deleteKeyword(keywordToDelete);
    setKeywordToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">
              Aucune catégorie disponible
            </h3>
            <p className="text-muted-foreground mb-4">
              Assurez-vous que des catégories DipiPixel existent sur votre site WordPress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!isClientView && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchKeywords()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      )}
      
      {isClientView && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Gestion de vos mots-clés</h2>
          <p className="text-muted-foreground">
            Personnalisez les mots-clés pour chaque catégorie de votre site. Ces mots-clés seront utilisés pour générer du contenu optimisé pour votre site web.
          </p>
        </div>
      )}
      
      {categories.map((category) => {
        const categoryKeywords = getKeywordsForCategory(category.id.toString());
        const hasMaxKeywords = categoryKeywords.length >= 10;
        
        return (
          <Card key={category.id} className="overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>
                {isClientView ? (
                  `${categoryKeywords.length}/10 mots-clés pour cette catégorie`
                ) : (
                  `ID: ${category.id} - ${categoryKeywords.length}/10 mots-clés`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {categoryKeywords.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {isClientView ? 
                        "Ajoutez des mots-clés pour cette catégorie afin d'optimiser la génération de contenu." :
                        "Aucun mot-clé pour cette catégorie"
                      }
                    </p>
                  ) : (
                    categoryKeywords.map((keyword) => (
                      <div key={keyword.id} className="flex items-center">
                        <Badge className="pr-1 flex items-center gap-1">
                          {keyword.keyword}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                                onClick={() => setKeywordToDelete(keyword.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action va supprimer le mot-clé "{keyword.keyword}" de la catégorie "{category.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setKeywordToDelete(null)}>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteKeyword}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Input
                    placeholder={isClientView ? "Entrez un mot-clé pour cette catégorie..." : "Nouveau mot-clé..."}
                    value={newKeywords[category.id] || ""}
                    onChange={(e) => setNewKeywords({
                      ...newKeywords,
                      [category.id]: e.target.value
                    })}
                    disabled={hasMaxKeywords || isSubmitting}
                  />
                  <Button
                    onClick={() => handleAddKeyword(category.id.toString(), category.name)}
                    disabled={!newKeywords[category.id]?.trim() || hasMaxKeywords || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {hasMaxKeywords && (
                  <p className="text-amber-500 text-sm">
                    Nombre maximum de mots-clés atteint (10)
                  </p>
                )}
                {isClientView && !hasMaxKeywords && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez des mots-clés spécifiques à votre activité pour améliorer le contenu généré pour cette catégorie.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TomeCategories;
