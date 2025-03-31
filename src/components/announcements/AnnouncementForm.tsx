
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, ArrowLeft, Save, ExternalLink, Sparkles, PencilLine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useContentOptimization } from "@/hooks/useContentOptimization";

export interface AnnouncementFormProps {
  onSubmit?: (data: AnnouncementFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
  isMobile?: boolean;
  initialValues?: AnnouncementFormData;
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

const AnnouncementForm = ({
  onSubmit,
  isSubmitting = false,
  onCancel,
  isMobile = false,
  initialValues
}: AnnouncementFormProps) => {
  const defaultValues: AnnouncementFormData = {
    title: "",
    description: "",
    wordpressCategory: "",
    publishDate: undefined,
    status: "published", // Fixed: Now explicitly using a literal type value
    images: [],
    seoTitle: "",
    seoDescription: "",
    seoSlug: ""
  };

  const form = useForm<AnnouncementFormData>({
    defaultValues: initialValues || defaultValues
  });

  // Update form values when initialValues changes
  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        const typedKey = key as keyof AnnouncementFormData;
        form.setValue(typedKey, initialValues[typedKey]);
      });
    }
  }, [initialValues, form]);

  const navigate = useNavigate();
  const {
    optimizeContent,
    isOptimizing
  } = useContentOptimization();
  const {
    watch,
    setValue
  } = form;
  const title = watch("title");

  useEffect(() => {
    if (title) {
      const normalizedTitle = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
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
      const optimizedContent = await optimizeContent(field, currentTitle, currentDescription);
      if (optimizedContent) {
        form.setValue(field, optimizedContent);
      }
    } catch (error: any) {
      console.error(`Error optimizing ${field}:`, error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/announcements');
    }
  };

  const getCardStyles = (isSectionCard = false) => {
    if (isMobile) {
      return isSectionCard ? "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0" : "border-0 shadow-none bg-transparent";
    }
    return "border shadow-sm";
  };

  return <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit || (() => {}))} className="space-y-6">
          <div className="space-y-6">
            <div className={`${isMobile ? "px-4" : ""}`}>
              <Card className={getCardStyles(true)}>
                <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
                  <CardTitle className="text-lg font-medium">Votre annonce</CardTitle>
                  {!isMobile && <CardDescription className="text-amber-400">
                      Les informations essentielles de votre annonce
                    </CardDescription>}
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? "px-0 py-3" : ""}`}>
                  <FormField control={form.control} name="title" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Entrez le titre de l'annonce" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <DescriptionField form={form} />
                </CardContent>
              </Card>
            </div>
            
            <div className={`${isMobile ? "px-4" : ""}`}>
              <Card className={getCardStyles(true)}>
                <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
                  <CardTitle className="text-lg font-medium">Images</CardTitle>
                  {!isMobile && <CardDescription className="text-amber-400">
                      Ajoutez des images à votre annonce pour attirer l'attention
                    </CardDescription>}
                </CardHeader>
                <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
                  <ImageUploader form={form} />
                </CardContent>
              </Card>
            </div>
            
            <div className={`${isMobile ? "px-4" : ""}`}>
              <Card className={getCardStyles(true)}>
                <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
                  <CardTitle className="text-lg font-medium">Options de publication</CardTitle>
                  {!isMobile && <CardDescription className="text-amber-400">
                      Paramètres de publication et de diffusion
                    </CardDescription>}
                </CardHeader>
                <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
                  <PublishingOptions form={form} />
                </CardContent>
              </Card>
            </div>
            
            <div className={`${isMobile ? "px-4" : ""}`}>
              <Card className={getCardStyles(true)}>
                <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"} flex flex-row items-center justify-between space-y-0`}>
                  <div>
                    <CardTitle className="text-lg font-medium">SEO</CardTitle>
                    {!isMobile && <CardDescription className="text-amber-400">
                        Optimisez votre annonce pour les moteurs de recherche
                      </CardDescription>}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    SEO
                  </Badge>
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? "px-0 py-3" : ""}`}>
                  {!isMobile}
                  
                  <FormField control={form.control} name="seoTitle" render={({
                  field
                }) => <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Titre SEO</FormLabel>
                          <Button type="button" size="sm" variant="outline" className="flex items-center gap-1 h-8" onClick={() => optimizeSeoContent('seoTitle')} disabled={isOptimizing.seoTitle}>
                            {isOptimizing.seoTitle ? <>
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs">Optimisation...</span>
                              </> : <>
                                <Sparkles size={14} />
                                <span className="text-xs">Optimiser</span>
                              </>}
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="Titre optimisé pour les moteurs de recherche" {...field} />
                        </FormControl>
                        <FormDescription className="font-normal">
                          Idéalement entre 50 et 60 caractères.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="seoDescription" render={({
                  field
                }) => <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Méta description</FormLabel>
                          <Button type="button" size="sm" variant="outline" className="flex items-center gap-1 h-8" onClick={() => optimizeSeoContent('seoDescription')} disabled={isOptimizing.seoDescription}>
                            {isOptimizing.seoDescription ? <>
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs">Optimisation...</span>
                              </> : <>
                                <Sparkles size={14} />
                                <span className="text-xs">Optimiser</span>
                              </>}
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea placeholder="Description courte qui apparaîtra dans les résultats de recherche" className="resize-none min-h-[100px]" {...field} />
                        </FormControl>
                        <FormDescription>
                          Idéalement entre 120 et 158 caractères.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="seoSlug" render={({
                  field
                }) => <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">yoursite.com/annonces/</span>
                            <Input placeholder="slug-de-url" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          L'URL qui sera utilisée pour accéder à cette annonce.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  {!isMobile && <Card className="border border-muted mt-4 bg-muted/10">
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
                    </Card>}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className={`flex justify-end gap-2 pt-4 ${isMobile ? "px-4 sticky bottom-0 bg-background pb-4 border-t border-border mt-4" : ""}`}>
            <Button type="button" variant="outline" onClick={handleCancel} className="px-4">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-4">
              {isSubmitting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </> : <>
                  <Save className="mr-2 h-4 w-4" />
                  Publier
                </>}
            </Button>
          </div>
        </form>
      </Form>
    </div>;
};

export default AnnouncementForm;
