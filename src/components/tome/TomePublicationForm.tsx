
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useTomeGeneration, useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { toast } from "sonner";
import DescriptionField from "@/components/tome/TomeDescriptionField";
import { Loader2, Save } from "lucide-react";

interface TomePublicationFormProps {
  configId: string;
  isClientView?: boolean;
}

interface PublicationFormData {
  title: string;
  categoryId: string;
  keywordId: string | null;
  localityId: string | null;
  description: string;
}

const TomePublicationForm: React.FC<TomePublicationFormProps> = ({ 
  configId, 
  isClientView = false
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    categories, 
    keywords, 
    isLoading: isLoadingKeywords,
    getKeywordsForCategory
  } = useCategoriesKeywords(configId);

  const { 
    activeLocalities,
    isLoading: isLoadingLocalities
  } = useLocalities(configId);
  
  const {
    createGeneration
  } = useTomeGeneration(configId);

  const form = useForm<PublicationFormData>({
    defaultValues: {
      title: "",
      categoryId: "",
      keywordId: null,
      localityId: null,
      description: "",
    }
  });

  const { watch, setValue } = form;
  const categoryId = watch("categoryId");

  // Lorsque la catégorie change, réinitialiser le mot-clé
  React.useEffect(() => {
    if (categoryId) {
      setValue("keywordId", null);
    }
  }, [categoryId, setValue]);

  const selectedCategoryKeywords = categoryId 
    ? getKeywordsForCategory(categoryId)
    : [];

  const onSubmit = async (data: PublicationFormData) => {
    try {
      setIsSubmitting(true);
      
      // Trouver les objets complets pour le mot-clé et la localité
      const keywordObj = data.keywordId && data.keywordId !== "none"
        ? keywords.find(k => k.id === data.keywordId) || null
        : null;
      
      const localityObj = data.localityId && data.localityId !== "none"
        ? activeLocalities.find(l => l.id === data.localityId) || null
        : null;
      
      // Créer la génération en mode brouillon
      const success = await createGeneration(
        data.categoryId,
        keywordObj,
        localityObj,
        null, // Pas de planification
        data.title,
        data.description,
        "draft" // Statut brouillon
      );
      
      if (success) {
        toast.success("Publication créée en mode brouillon");
        // Rediriger vers la liste des publications
        navigate("/tome");
      }
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      toast.error(`Une erreur est survenue: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingKeywords || isLoadingLocalities;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-muted-foreground">
              Chargement des données...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isClientView ? "Nouvelle publication" : "Créer une publication"}</CardTitle>
        <CardDescription>
          Créez un contenu optimisé avec l'IA en utilisant vos catégories, mots-clés et localités.
          Le contenu sera créé en mode brouillon pour vous permettre de l'éditer avant publication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Entrez un titre (ou laissez vide pour génération automatique)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                rules={{ required: "La catégorie est obligatoire" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="keywordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot-clé (optionnel)</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={!categoryId || selectedCategoryKeywords.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !categoryId 
                              ? "Sélectionnez d'abord une catégorie" 
                              : selectedCategoryKeywords.length === 0
                                ? "Aucun mot-clé disponible"
                                : "Sélectionner un mot-clé"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem key="no-keyword" value="none">Aucun mot-clé</SelectItem>
                        {selectedCategoryKeywords.map((keyword) => (
                          <SelectItem key={keyword.id} value={keyword.id}>
                            {keyword.keyword}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="localityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localité (optionnel)</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={activeLocalities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            activeLocalities.length === 0
                              ? "Aucune localité disponible"
                              : "Sélectionner une localité"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem key="no-locality" value="none">Aucune localité</SelectItem>
                        {activeLocalities.map((locality) => (
                          <SelectItem key={locality.id} value={locality.id}>
                            {locality.name} {locality.region ? `(${locality.region})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions supplémentaires (optionnel)</FormLabel>
                  <FormControl>
                    <DescriptionField 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Instructions supplémentaires pour l'IA (style, longueur, points à aborder...)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/tome")}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer en brouillon
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TomePublicationForm;
