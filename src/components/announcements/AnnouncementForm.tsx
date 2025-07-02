import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MediaUploader from "./MediaUploader";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useFormPersistence } from "@/hooks/useFormPersistence";

export interface AnnouncementFormProps {
  onSubmit?: (data: AnnouncementFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
  isMobile?: boolean;
  initialValues?: AnnouncementFormData;
  storageKey?: string;
}

export interface AnnouncementFormData {
  title: string;
  description: string;
  wordpressCategory: string;
  publishDate: Date | undefined;
  status: "draft" | "published" | "scheduled";
  images: string[];
  additionalMedias: string[]; // NEW FIELD
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
}

const AnnouncementForm = ({
  onSubmit,
  isSubmitting = false,
  onCancel,
  isMobile = false,
  initialValues,
  storageKey = "announcement-form-draft"
}: AnnouncementFormProps) => {
  const defaultValues: AnnouncementFormData = {
    title: "",
    description: "",
    wordpressCategory: "",
    publishDate: undefined,
    status: "published",
    images: [],
    additionalMedias: [], // NEW FIELD
    seoTitle: "",
    seoDescription: "",
    seoSlug: ""
  };
  
  const form = useForm<AnnouncementFormData>({
    defaultValues: initialValues || defaultValues
  });

  // Clear localStorage data on component mount
  useEffect(() => {
    if (!initialValues) {
      localStorage.removeItem(storageKey);
      form.reset(defaultValues);
    }
  }, [form, initialValues, storageKey]);

  // Activer la persistance du formulaire
  const {
    clearSavedData,
    hasSavedData,
    saveData
  } = useFormPersistence(form, storageKey, initialValues);
  
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  
  useEffect(() => {
    // Vérifier s'il y a un brouillon sauvegardé après le montage du composant
    const checkForDraft = () => {
      const hasDraft = hasSavedData();
      setShowDraftNotice(hasDraft);

      // Force une sauvegarde après le chargement pour s'assurer que tout est persisté
      if (form.getValues().title || form.getValues().description) {
        saveData();
      }
    };

    // Attendre que le DOM soit complètement chargé
    setTimeout(checkForDraft, 500);
  }, [hasSavedData, saveData, form]);
  
  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach(key => {
        const typedKey = key as keyof AnnouncementFormData;
        form.setValue(typedKey, initialValues[typedKey]);
      });
    }
  }, [initialValues, form]);

  // Forcer une sauvegarde lorsque certains champs complexes changent
  useEffect(() => {
    const subscription = form.watch((value, {
      name
    }) => {
      if (name === 'description' || name === 'images' || name === 'additionalMedias' || name === 'wordpressCategory') {
        // Force une sauvegarde après un court délai pour s'assurer que tout est à jour
        setTimeout(saveData, 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, saveData]);
  
  const navigate = useNavigate();
  const {
    watch,
    setValue
  } = form;
  const title = watch("title");
  
  useEffect(() => {
    if (title) {
      const normalizedTitle = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
      
      // Ne régénérer le slug automatiquement que si :
      // 1. Il n'y a pas de valeurs initiales (nouvelle annonce)
      // 2. OU si le slug actuel est vide
      // 3. OU si l'annonce est encore en draft
      const currentSlug = form.getValues("seoSlug");
      const currentStatus = form.getValues("status");
      const isNewAnnouncement = !initialValues;
      const isSlugEmpty = !currentSlug || currentSlug === "";
      const isDraft = currentStatus === "draft";
      
      if (isNewAnnouncement || isSlugEmpty || isDraft) {
        setValue("seoSlug", normalizedTitle);
      }
      
      if (!form.getValues("seoTitle") || form.getValues("seoTitle") === "") {
        setValue("seoTitle", title);
      }
    }
  }, [title, setValue, form, initialValues]);
  
  const handleCancel = () => {
    if (window.confirm("Êtes-vous sûr de vouloir quitter ? Votre brouillon sera conservé pour plus tard.")) {
      if (onCancel) {
        onCancel();
      } else {
        navigate('/announcements');
      }
    }
  };
  
  const handleFormSubmit = (data: AnnouncementFormData) => {
    if (onSubmit) {
      clearSavedData();
      onSubmit(data);
    }
  };
  
  const getCardStyles = (isSectionCard = false) => {
    if (isMobile) {
      return isSectionCard ? "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0" : "border-0 shadow-none bg-transparent";
    }
    return "border shadow-sm";
  };
  
  return <div className="space-y-6">
      {showDraftNotice}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                  <CardTitle className="text-lg font-medium">Image</CardTitle>
                  {!isMobile && <CardDescription className="text-amber-400">
                      Ajoutez une image à votre annonce pour attirer l'attention
                    </CardDescription>}
                </CardHeader>
                <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
                  <MediaUploader form={form} />
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
                  Publier l'annonce
                </>}
            </Button>
          </div>
        </form>
      </Form>
    </div>;
};

export default AnnouncementForm;
