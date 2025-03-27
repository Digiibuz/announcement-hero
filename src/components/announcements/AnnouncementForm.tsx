
import React, { useState } from "react";
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
} from "@/components/ui/form";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import AnnouncementPreview from "./AnnouncementPreview";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import DescriptionField from "./DescriptionField";
import PublishingOptions from "./PublishingOptions";

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
    }
  });

  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

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
            
            <ImageUploader form={form} />
            
            <PublishingOptions form={form} />

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
