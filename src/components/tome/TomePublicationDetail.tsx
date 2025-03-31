
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TomeDescriptionField from "./TomeDescriptionField";
import { useTomeGeneration } from "@/hooks/tome";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TomeGeneration } from "@/types/tome";

const TomePublicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generation, setGeneration] = useState<TomeGeneration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { getGenerationById, updateGeneration } = useTomeGeneration(generation?.wordpress_config_id || "");

  useEffect(() => {
    const fetchGeneration = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const fetchedGeneration = await getGenerationById(id);
        if (fetchedGeneration) {
          setGeneration(fetchedGeneration);
          form.reset({
            title: fetchedGeneration.title || "",
            content: fetchedGeneration.content || "",
            description: fetchedGeneration.description || "",
          });
        } else {
          toast.error("Publication non trouvée");
          navigate("/tome");
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la publication:", error);
        toast.error("Erreur lors du chargement de la publication");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeneration();
  }, [id, getGenerationById, navigate]);

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      description: "",
    },
  });

  const onSubmit = async (data: { title: string; content: string; description: string }) => {
    if (!generation || !id) return;
    
    try {
      setIsSubmitting(true);
      
      const success = await updateGeneration(id, {
        title: data.title,
        content: data.content,
        description: data.description,
      });
      
      if (success) {
        toast.success("Publication mise à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
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

  if (!generation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Publication non trouvée</h3>
            <Button onClick={() => navigate("/tome")}>Retour aux publications</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {generation.status === "draft" 
            ? "Modifier la publication" 
            : "Détails de la publication"}
        </CardTitle>
        <CardDescription>
          {generation.status === "draft" 
            ? "Modifiez le contenu avant publication" 
            : "Consultez les détails de cette publication"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Titre de la publication" 
                      {...field} 
                      disabled={generation.status !== "draft"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contenu de la publication" 
                      value={field.value}
                      onChange={field.onChange}
                      className="min-h-[300px]"
                      disabled={generation.status !== "draft"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions supplémentaires</FormLabel>
                  <FormControl>
                    <TomeDescriptionField 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Instructions supplémentaires pour l'IA"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {generation.status === "draft" && (
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
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TomePublicationDetail;
