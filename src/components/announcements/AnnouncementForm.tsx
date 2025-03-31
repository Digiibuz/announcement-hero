
"use client"

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import ImageUploader from "./ImageUploader";
import { fr } from "date-fns/locale";
import { useWordPressCategories } from "@/hooks/useWordPressCategories";
import { useWordPressDivipixelCategories } from "@/hooks/useWordPressDivipixelCategories";

export type AnnouncementFormData = {
  title: string;
  description: string;
  status: string;
  wordpressCategory?: string;
  publishDate?: Date;
  images?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
};

interface AnnouncementFormProps {
  onSubmit: (data: AnnouncementFormData) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<AnnouncementFormData>;
  onCancel?: () => void;
  isMobile?: boolean;
  isDivipixel?: boolean;
}

const currentDatePlus7Days = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  onSubmit,
  isSubmitting = false,
  initialValues,
  onCancel,
  isMobile = false,
  isDivipixel = false
}) => {
  const [activeTab, setActiveTab] = useState("content");
  const { categories: wpCategories, isLoading: isLoadingCategories } = useWordPressCategories();
  const { categories: divipixelCategories, isLoading: isLoadingDivipixelCategories } = useWordPressDivipixelCategories();
  
  const categories = isDivipixel ? divipixelCategories : wpCategories;
  const isLoadingCategoryData = isDivipixel ? isLoadingDivipixelCategories : isLoadingCategories;

  const formSchema = z.object({
    title: z.string().min(5, { message: "Le titre doit contenir au moins 5 caractères" }),
    description: z.string().optional(),
    status: z.string(),
    wordpressCategory: z.string().optional(),
    publishDate: z.date().optional(),
    images: z.array(z.string()).optional(),
    seoTitle: z.string().max(60, { message: "Le titre SEO ne doit pas dépasser 60 caractères" }).optional(),
    seoDescription: z.string().max(160, { message: "La description SEO ne doit pas dépasser 160 caractères" }).optional(),
    seoSlug: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      status: initialValues?.status || "draft",
      wordpressCategory: initialValues?.wordpressCategory || "",
      publishDate: initialValues?.publishDate,
      images: initialValues?.images || [],
      seoTitle: initialValues?.seoTitle || "",
      seoDescription: initialValues?.seoDescription || "",
      seoSlug: initialValues?.seoSlug || "",
    }
  });

  // Set publish date to today + 7 days when status changes to scheduled
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "status" && value.status === "scheduled" && !value.publishDate) {
        form.setValue("publishDate", currentDatePlus7Days());
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Sync form state with initialValues (useful for edit mode)
  useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        if (value !== undefined) {
          // @ts-ignore - we know these fields exist
          form.setValue(key, value);
        }
      });
    }
  }, [initialValues, form]);

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="publishing">Publication</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez un titre accrocheur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DescriptionField 
              form={form} 
              isForDiviPixel={isDivipixel}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUploader 
                      value={field.value || []} 
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="publishing" className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <FormControl>
                    <PublishingOptions 
                      value={field.value} 
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show publish date if status is scheduled */}
            {form.watch("status") === "scheduled" && (
              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de publication</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="wordpressCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isDivipixel ? "Catégorie Divipixel" : "Catégorie WordPress"}</FormLabel>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoadingCategoryData}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingCategoryData && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      <span>Chargement des catégories...</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
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
                      value={field.value || ''}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    {field.value?.length || 0}/60 caractères
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description SEO</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Description courte apparaissant dans les résultats de recherche" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    {field.value?.length || 0}/160 caractères
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seoSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="mon-annonce-slug" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialValues ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AnnouncementForm;
