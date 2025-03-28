
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
import { Loader2, ArrowLeft, Save, ExternalLink, Sparkles, Eye, PencilLine } from "lucide-react";
import AnnouncementPreview from "./AnnouncementPreview";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export interface AnnouncementFormProps {
  onSubmit?: (data: AnnouncementFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
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

const AnnouncementForm = ({ onSubmit, isSubmitting = false, onCancel }: AnnouncementFormProps) => {
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
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSeoTitleOptimizing, setIsSeoTitleOptimizing] = useState(false);
  const [isSeoDescriptionOptimizing, setIsSeoDescriptionOptimizing] = useState(false);
  const { watch, setValue } = form;
  const title = watch("title");

  useEffect(() => {
    if (title) {
      const normalizedTitle = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      
      setValue("seoSlug", normalizedTitle);
      
      if (!form.getValues("seoTitle")) {
        setValue("seoTitle", title);
      }
    }
  }, [title, setValue]);

  const optimizeSeoContent = async (field: 'seoTitle' | 'seoDescription') => {
    try {
      const currentTitle = form.getValues('title');
      const currentDescription = form.getValues('description');
      
      if (!currentTitle || !currentDescription) {
        toast.warning("Veuillez d'abord saisir le titre et la description de l'annonce");
        return;
      }
      
      if (field === 'seoTitle') {
        setIsSeoTitleOptimizing(true);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const optimizedTitle = currentTitle
          .split(' ')
          .map(word => word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
          .join(' ');
        
        form.setValue('seoTitle', optimizedTitle);
        toast.success("Titre SEO optimisé avec succès");
      } else {
        setIsSeoDescriptionOptimizing(true);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const plainText = currentDescription.replace(/<[^>]*>?/gm, '');
        const firstPart = plainText.substring(0, 120);
        const optimizedDescription = `${firstPart}... Découvrez cette annonce exceptionnelle!`;
        
        form.setValue('seoDescription', optimizedDescription);
        toast.success("Méta description optimisée avec succès");
      }
    } catch (error: any) {
      console.error(`Error optimizing ${field}:`, error);
      toast.error(`Erreur lors de l'optimisation: ${error.message}`);
    } finally {
      if (field === 'seoTitle') {
        setIsSeoTitleOptimizing(false);
      } else {
        setIsSeoDescriptionOptimizing(false);
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/announcements');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <PencilLine className="h-4 w-4" />
            Éditer
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="pt-4 animate-fade-in">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit || (() => {}))} className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">Informations de base</CardTitle>
                    <CardDescription>
                      Les informations essentielles de votre annonce
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Entrez le titre de l'annonce" 
                              className="h-11"
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">Images</CardTitle>
                    <CardDescription>
                      Ajoutez des images à votre annonce pour attirer l'attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUploader form={form} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">Options de publication</CardTitle>
                    <CardDescription>
                      Paramètres de publication et de diffusion
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PublishingOptions form={form} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-medium">SEO</CardTitle>
                      <CardDescription>
                        Optimisez votre annonce pour les moteurs de recherche
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      SEO
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Ces informations aideront à améliorer la visibilité de votre annonce dans les résultats de recherche Google.
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Titre SEO</FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 h-8"
                              onClick={() => optimizeSeoContent('seoTitle')}
                              disabled={isSeoTitleOptimizing}
                            >
                              {isSeoTitleOptimizing ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span className="text-xs">Optimisation...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  <span className="text-xs">Optimiser</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Titre optimisé pour les moteurs de recherche" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Idéalement entre 50 et 60 caractères.
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
                          <div className="flex justify-between items-center">
                            <FormLabel>Méta description</FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 h-8"
                              onClick={() => optimizeSeoContent('seoDescription')}
                              disabled={isSeoDescriptionOptimizing}
                            >
                              {isSeoDescriptionOptimizing ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span className="text-xs">Optimisation...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  <span className="text-xs">Optimiser</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea 
                              placeholder="Description courte qui apparaîtra dans les résultats de recherche" 
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Idéalement entre 120 et 158 caractères.
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
                            L'URL qui sera utilisée pour accéder à cette annonce.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Card className="border border-muted mt-4 bg-muted/10">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Aperçu dans Google
                        </h3>
                        <div className="text-blue-600 text-lg font-medium truncate">
                          {form.getValues('seoTitle') || form.getValues('title') || "Titre de votre annonce"}
                        </div>
                        <div className="text-green-700 text-sm mb-1">
                          yoursite.com/annonces/{form.getValues('seoSlug') || "url-de-lannonce"}
                        </div>
                        <div className="text-slate-700 text-sm line-clamp-2">
                          {form.getValues('seoDescription') || "Ajoutez une méta description pour qu'elle apparaisse ici."}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="px-4"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4"
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
        </TabsContent>
        
        <TabsContent value="preview" className="pt-4 animate-fade-in">
          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setActiveTab("edit")}
              className="px-4"
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Revenir à l'édition
            </Button>
            <Button 
              onClick={() => form.handleSubmit(onSubmit || (() => {}))()}
              disabled={isSubmitting}
              className="px-4"
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnnouncementForm;

// Import for Search icon
import { Search } from "lucide-react";
