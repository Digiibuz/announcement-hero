
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, Save, ExternalLink } from "lucide-react";
import AnnouncementPreview from "./AnnouncementPreview";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnnouncementFormProps {
  onSubmit?: (data: AnnouncementFormData) => void;
  isSubmitting?: boolean;
}

export interface AnnouncementFormData {
  title: string;
  description: string;
  wordpressCategory: string;
  publishDate: Date | undefined;
  status: "draft" | "published" | "scheduled";
  images: string[];
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
}

const AnnouncementForm = ({ onSubmit, isSubmitting = false }: AnnouncementFormProps) => {
  const form = useForm<AnnouncementFormData>({
    defaultValues: {
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "draft",
      images: [],
      seoTitle: "",
      seoDescription: "",
      seoSlug: "",
    }
  });

  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const { watch, setValue } = form;
  const title = watch("title");

  // Generate slug from title
  useEffect(() => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
      
      setValue("seoSlug", slug);
      
      // Only set SEO title if it's empty
      if (!form.getValues("seoTitle")) {
        setValue("seoTitle", title);
      }
    }
  }, [title, setValue]);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleFormSubmit = (data: AnnouncementFormData) => {
    if (onSubmit) {
      onSubmit(data);
    } else {
      console.log("Form submitted:", data);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Créer une nouvelle annonce</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={togglePreview}
          >
            {showPreview ? "Modifier" : "Aperçu"}
          </Button>
          <Button 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate('/announcements')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Retour
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="animate-fade-in">
          <AnnouncementPreview data={{
            title: form.getValues('title'),
            description: form.getValues('description'),
            category: form.getValues('wordpressCategory'),
            publishDate: form.getValues('publishDate'),
            status: form.getValues('status'),
            images: form.getValues('images'),
            seoTitle: form.getValues('seoTitle'),
            seoDescription: form.getValues('seoDescription'),
            seoSlug: form.getValues('seoSlug'),
          }} />
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => {
                setShowPreview(false);
                form.handleSubmit(handleFormSubmit)();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer l'annonce
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 animate-fade-in">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Entrez le titre de l'annonce" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DescriptionField form={form} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUploader form={form} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Options de publication</CardTitle>
                </CardHeader>
                <CardContent>
                  <PublishingOptions form={form} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Optimisation pour les moteurs de recherche</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    SEO
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Ces informations aideront à améliorer la visibilité de votre annonce dans les résultats de recherche Google.
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre SEO</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Titre optimisé pour les moteurs de recherche" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Idéalement entre 50 et 60 caractères. Si vide, le titre principal sera utilisé.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Méta description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description courte qui apparaîtra dans les résultats de recherche" 
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Idéalement entre 120 et 158 caractères. Décrivez votre annonce de manière attrayante pour les utilisateurs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seoSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">yoursite.com/annonces/</span>
                            <Input 
                              placeholder="slug-de-url" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          L'URL qui sera utilisée pour accéder à cette annonce. Générée automatiquement à partir du titre.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border rounded-md p-4 mt-2">
                    <div className="text-blue-600 text-xl font-medium truncate">
                      {form.getValues('seoTitle') || form.getValues('title') || "Titre de votre annonce"}
                    </div>
                    <div className="text-green-700 text-sm mb-1">
                      yoursite.com/annonces/{form.getValues('seoSlug') || "url-de-lannonce"}
                    </div>
                    <div className="text-slate-700 text-sm line-clamp-2">
                      {form.getValues('seoDescription') || "Ajoutez une méta description pour qu'elle apparaisse ici. Sans cela, Google pourrait utiliser un extrait du contenu de votre page."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/announcements')}
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
                    Enregistrer l'annonce
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AnnouncementForm;
