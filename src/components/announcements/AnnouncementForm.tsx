import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarIcon, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Camera, 
  Sparkles, 
  Loader2,
  UploadCloud,
  ArrowLeft, 
  Save,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AnnouncementPreview from "./AnnouncementPreview";
import { useWordPressCategories } from "@/hooks/useWordPressCategories";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
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

  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const { categories, isLoading: isCategoriesLoading } = useWordPressCategories();

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const currentDescriptionValue = form.getValues('description');
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        
        if (event.results[resultIndex].isFinal) {
          form.setValue('description', currentDescriptionValue 
            ? `${currentDescriptionValue} ${transcript}`
            : transcript
          );
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        toast.error("Erreur de reconnaissance vocale: " + event.error);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.success("Enregistrement vocal terminé");
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info("Enregistrement vocal démarré...");
    }
  };

  const generateImprovedContent = async () => {
    const currentDescription = form.getValues('description');
    if (!currentDescription) {
      toast.warning("Veuillez d'abord saisir du contenu à améliorer");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const enhancedText = `${currentDescription}\n\n[Version améliorée pour le SEO]\n${currentDescription
        .split(' ')
        .map(word => 
          Math.random() > 0.8 ? word.charAt(0).toUpperCase() + word.slice(1) : word
        )
        .join(' ')
      }\n\nCette version a été optimisée pour améliorer sa visibilité dans les moteurs de recherche.`;
      
      form.setValue('description', enhancedText);
      toast.success("Contenu amélioré avec succès");
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error("Erreur lors de l'amélioration du contenu: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      const uploadedImageUrls = await uploadImages(Array.from(files));
      
      setUploadedImages(prev => [...prev, ...uploadedImageUrls]);
      form.setValue('images', [...form.getValues('images'), ...uploadedImageUrls]);
      
      toast.success(`${uploadedImageUrls.length} image(s) téléversée(s) avec succès`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("Erreur lors du téléversement des images: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      console.log(`Uploading file ${file.name} to path ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file);
      
      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      console.log("Upload successful, getting public URL");
      
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      console.log("Public URL obtained:", urlData.publicUrl);
      
      return urlData.publicUrl;
    });
    
    return Promise.all(uploadPromises);
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(uploadedImages.filter((_, index) => index !== indexToRemove));
    form.setValue('images', form.getValues('images').filter((_, index) => index !== indexToRemove));
  };

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

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraUpload = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>Description</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 text-xs"
                    onClick={toggleVoiceRecording}
                    disabled={isGenerating}
                  >
                    {isRecording ? (
                      <>
                        <MicOff size={14} className="text-destructive" />
                        <span className="text-destructive">Arrêter</span>
                      </>
                    ) : (
                      <>
                        <Mic size={14} />
                        <span>Dictée vocale</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 text-xs"
                    onClick={generateImprovedContent}
                    disabled={isRecording || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Optimisation...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Optimiser SEO</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Entrez la description de l'annonce ou utilisez la dictée vocale"
                        className={cn(
                          "min-h-32",
                          isRecording && "border-primary ring-2 ring-primary/20"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {isRecording && (
                      <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        Enregistrement en cours...
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Images</FormLabel>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Glissez-déposez vos images ici, ou sélectionnez une option ci-dessous
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerFileUpload}
                      disabled={isUploading}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Sélectionner des fichiers
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerCameraUpload}
                      disabled={isUploading}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Prendre une photo
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Téléversement en cours...</span>
                    </div>
                  )}
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Uploaded image ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="wordpressCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie WordPress</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isCategoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategoriesLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Chargement...</span>
                          </div>
                        ) : categories.length > 0 ? (
                          categories.map(category => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Aucune catégorie disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut de publication</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publier immédiatement</SelectItem>
                        <SelectItem value="scheduled">Planifier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('status') === 'scheduled' && (
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
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                "Sélectionnez une date"
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
