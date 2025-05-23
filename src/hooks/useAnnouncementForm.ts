
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AnnouncementFormData } from "@/components/announcements/AnnouncementForm";
import { useFormPersistence } from "@/hooks/useFormPersistence";

export const useAnnouncementForm = (onPublishingStart?: () => void) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const visibilityChangeHandlingRef = useRef(false);
  const lastVisibilityChangeTimeRef = useRef(0);
  const visibilityChangeCountRef = useRef(0);
  const isInitialMount = useRef(true);

  const form = useForm<AnnouncementFormData & { _currentStep?: number }>({
    defaultValues: {
      title: "",
      description: "",
      wordpressCategory: "",
      publishDate: undefined,
      status: "published",
      images: [],
      seoTitle: "",
      seoDescription: "",
      seoSlug: "",
      _currentStep: 0
    }
  });

  const { clearSavedData, hasSavedData, saveData, getSavedStep } = useFormPersistence(
    form,
    "announcement-form-draft",
    undefined,
    2000,
    false
  );

  // Handle title changes to update SEO title and slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title') {
        const title = value.title as string;
        if (title) {
          if (!form.getValues("seoTitle")) {
            form.setValue("seoTitle", title);
          }
          const normalizedTitle = title.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
          form.setValue("seoSlug", normalizedTitle);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Clear form data when the user navigates away from the form
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
      if (window.location.pathname !== '/create') {
        clearSavedData();
      }
    };
  }, [clearSavedData]);

  const saveAnnouncementDraft = async () => {
    try {
      setIsSavingDraft(true);
      
      if (!user?.id) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour enregistrer un brouillon",
          variant: "destructive"
        });
        return;
      }

      const formData = form.getValues();

      if (!formData.title && !formData.description && (!formData.images || formData.images.length === 0)) {
        toast({
          title: "Formulaire vide",
          description: "Veuillez remplir au moins un champ avant d'enregistrer un brouillon",
          variant: "destructive"
        });
        return;
      }

      const announcementData = {
        user_id: user.id,
        title: formData.title || "Brouillon sans titre",
        description: formData.description,
        status: "draft" as "draft",
        images: formData.images || [],
        wordpress_category_id: formData.wordpressCategory,
        publish_date: formData.publishDate ? new Date(formData.publishDate).toISOString() : null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        seo_slug: formData.seoSlug || null
      };

      const { error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Brouillon enregistré avec succès"
      });

      clearSavedData();
      form.reset();
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du brouillon: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      setIsSubmitting(true);
      if (onPublishingStart) onPublishingStart();

      clearSavedData();
      // Supprimer également l'étape courante de localStorage
      localStorage.removeItem("current-announcement-step");

      const announcementData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status as "draft" | "published" | "scheduled",
        images: data.images || [],
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null,
        seo_title: data.seoTitle || null,
        seo_description: data.seoDescription || null,
        seo_slug: data.seoSlug || null
      };

      const { error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Annonce enregistrée avec succès"
      });

      form.reset();
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    isSavingDraft,
    saveAnnouncementDraft,
    handleSubmit,
    clearSavedData,
    hasSavedData,
    saveData,
    getSavedStep
  };
};
