
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";
import { useCategoryKeywords } from "@/hooks/useCategoryKeywords";
import { DipiCptCategory } from "@/types/announcement";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KeywordsManagerProps {
  wordpressConfigId: string;
  categories: DipiCptCategory[];
}

const KeywordsManager = ({ wordpressConfigId, categories }: KeywordsManagerProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newKeyword, setNewKeyword] = useState("");
  const [deleteKeywordId, setDeleteKeywordId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DipiCptCategory | null>(null);

  const {
    keywords,
    isLoading,
    isSubmitting,
    addKeyword,
    deleteKeyword,
  } = useCategoryKeywords(wordpressConfigId, selectedCategoryId);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id.toString());
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const category = categories.find(cat => cat.id.toString() === selectedCategoryId);
    setSelectedCategory(category || null);
  }, [selectedCategoryId, categories]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !selectedCategoryId) return;
    
    try {
      await addKeyword(newKeyword.trim());
      setNewKeyword("");
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteKeywordId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteKeywordId) {
      try {
        await deleteKeyword(deleteKeywordId);
      } catch (error) {
        // L'erreur est déjà gérée dans le hook
      } finally {
        setDeleteKeywordId(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const generateKeywordSuggestions = async () => {
    // Cette fonction sera implémentée pour générer des suggestions de mots-clés via l'IA
    // Pour l'instant, elle est vide car nous la développerons plus tard
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Gestion des mots-clés</span>
            <Badge variant="outline" className="ml-2">
              {keywords.length}/10
            </Badge>
          </CardTitle>
          <CardDescription>
            Associez jusqu'à 10 mots-clés à chaque catégorie WordPress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="category-select" className="block text-sm font-medium mb-1">
              Catégorie
            </label>
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory ? (
            <>
              <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
                <Input
                  placeholder="Nouveau mot-clé (ex: réparation plomberie)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="flex-1"
                  disabled={isSubmitting || keywords.length >= 10}
                />
                <Button 
                  type="submit" 
                  disabled={!newKeyword.trim() || isSubmitting || keywords.length >= 10}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Ajouter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateKeywordSuggestions}
                  title="Générer des suggestions de mots-clés avec l'IA"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </form>

              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun mot-clé n'a été ajouté pour cette catégorie
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mot-clé</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((keyword) => (
                      <TableRow key={keyword.id}>
                        <TableCell>{keyword.keyword}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(keyword.id)}
                            title="Supprimer ce mot-clé"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Aucune catégorie disponible</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Ce mot-clé sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KeywordsManager;
