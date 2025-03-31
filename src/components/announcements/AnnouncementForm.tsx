
"use client"

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import ImageUploader from "./ImageUploader";
import { Card } from "@/components/ui/card";

// Définition du schéma de validation
const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled"]),
  images: z.array(z.string()).optional(),
  publishDate: z.string().optional(),
  wordpressCategory: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoSlug: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface AnnouncementFormProps {
  initialData?: any;
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  isMobile?: boolean;
  formType?: "announcement" | "divipixel"; // Type de formulaire
}

const AnnouncementForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  isMobile = false,
  formType = "announcement" // Par défaut, c'est un formulaire d'annonce standard
}: AnnouncementFormProps) => {
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialData?.status || "draft",
      images: initialData?.images || [],
      publishDate: initialData?.publish_date || "",
      wordpressCategory: initialData?.wordpress_category_id || "",
      seoTitle: initialData?.seo_title || "",
      seoDescription: initialData?.seo_description || "",
      seoSlug: initialData?.seo_slug || "",
    },
  });

  // Mettre à jour les valeurs du formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "draft",
        images: initialData.images || [],
        publishDate: initialData.publish_date || "",
        wordpressCategory: initialData.wordpress_category_id || "",
        seoTitle: initialData.seo_title || "",
        seoDescription: initialData.seo_description || "",
        seoSlug: initialData.seo_slug || "",
      });
    }
  }, [initialData, form]);

  // Gérer la soumission du formulaire
  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            {/* Champ titre */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Entrez le titre" 
                      {...field} 
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ description */}
            <FormItem>
              <DescriptionField 
                form={form}
                isMobile={isMobile}
              />
            </FormItem>

            {/* Téléchargement d'images */}
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
                      form={form}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Options de publication */}
        <PublishingOptions 
          form={form}
          formType={formType} // Passer le type de formulaire pour adapter les catégories
        />

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting 
              ? "Enregistrement en cours..." 
              : initialData 
                ? "Mettre à jour" 
                : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AnnouncementForm;
