
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, Eye, Send, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface PublicationFormData {
  title: string;
  content: string;
}

const TomePublicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publication, setPublication] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const form = useForm<PublicationFormData>({
    defaultValues: {
      title: "",
      content: ""
    }
  });

  // Charger les données de la publication
  useEffect(() => {
    const fetchPublication = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("tome_generations")
          .select("*, category:categories_keywords(category_name), keyword:categories_keywords(keyword), locality:localities(name, region)")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setPublication(data);
          form.setValue("title", data.title || "");
          form.setValue("content", data.content || "");
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement de la publication:", error);
        toast.error(`Erreur: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPublication();
  }, [id, form]);

  // Enregistrer les modifications
  const onSubmit = async (data: PublicationFormData) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("tome_generations")
        .update({
          title: data.title,
          content: data.content
        })
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Publication mise à jour avec succès");
      
      // Rafraîchir les données
      const { data: refreshedData, error: refreshError } = await supabase
        .from("tome_generations")
        .select("*, category:categories_keywords(category_name), keyword:categories_keywords(keyword), locality:localities(name, region)")
        .eq("id", id)
        .single();
      
      if (!refreshError && refreshedData) {
        setPublication(refreshedData);
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publier sur WordPress
  const handlePublish = async () => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      toast.info("Publication en cours...", { duration: 10000 });
      
      // Appeler la fonction Edge pour publier
      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { generationId: id }
      });
      
      if (error) {
        console.error("Erreur lors de l'appel à la fonction de publication:", error);
        toast.error(`Erreur: ${error.message}`);
        return;
      }
      
      if (data.success) {
        toast.success("Publication réussie sur WordPress");
        
        // Mettre à jour le statut en local
        setPublication({
          ...publication,
          status: "published",
          wordpress_post_id: data.wordpressPostId,
          published_at: new Date().toISOString()
        });
      } else {
        toast.error(`Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Erreur lors de la publication:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!publication) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          La publication n'a pas pu être chargée ou n'existe pas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/tome")}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "edit" ? "default" : "outline"}
            onClick={() => setActiveTab("edit")}
            className="flex items-center gap-1"
          >
            <Pencil className="h-4 w-4" />
            <span>Éditer</span>
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "outline"}
            onClick={() => setActiveTab("preview")}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span>Aperçu</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "edit" ? "Modifier la publication" : "Aperçu"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "edit" ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Informations sur la publication */}
              <div className="bg-muted/40 p-4 rounded-md mb-4">
                <div className="text-sm">
                  <p><strong>Catégorie:</strong> {publication.category?.category_name || "Non spécifiée"}</p>
                  {publication.keyword && (
                    <p><strong>Mot-clé:</strong> {publication.keyword.keyword}</p>
                  )}
                  {publication.locality && (
                    <p><strong>Localité:</strong> {publication.locality.name} {publication.locality.region ? `(${publication.locality.region})` : ''}</p>
                  )}
                  <p><strong>Statut:</strong> {
                    publication.status === "draft" ? "Brouillon" :
                    publication.status === "published" ? "Publié" :
                    publication.status === "scheduled" ? "Planifié" :
                    publication.status
                  }</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">Titre</label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">Contenu</label>
                  <Textarea
                    id="content"
                    {...form.register("content")}
                    className="min-h-[400px] w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
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
                
                {publication.status === "draft" && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handlePublish}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publication...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publier sur WordPress
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div className="prose max-w-none">
              <h1>{form.watch("title")}</h1>
              <div dangerouslySetInnerHTML={{ __html: form.watch("content") }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TomePublicationDetail;
