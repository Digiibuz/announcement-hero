
import React, { useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Upload, X, Play, Image as ImageIcon } from "lucide-react";
import { AnnouncementFormData } from "./AnnouncementForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploaderProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const MediaUploader = ({ form }: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { watch, setValue } = form;
  const images = watch("images") || [];

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      // Vérifier la taille du fichier (50MB max pour les vidéos, 10MB pour les images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux. Taille maximale: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
        continue;
      }

      try {
        // Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `announcements/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('Images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erreur lors de l'upload de ${file.name}`);
          continue;
        }

        // Obtenir l'URL publique
        const { data } = supabase.storage
          .from('Images')
          .getPublicUrl(filePath);

        if (data.publicUrl) {
          const currentImages = form.getValues("images") || [];
          setValue("images", [...currentImages, data.publicUrl]);
          toast.success(`${file.name} ajouté avec succès`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    // Reset l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const currentImages = form.getValues("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue("images", newImages);
  };

  const isVideo = (url: string) => {
    return /\.(mp4|mov|avi|mkv|webm)$/i.test(url);
  };

  const getMediaPreview = (url: string, index: number) => {
    if (isVideo(url)) {
      return (
        <div key={index} className="relative group">
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <video 
              src={url} 
              className="w-full h-full object-cover"
              muted
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeMedia(index)}
          >
            <X className="h-3 w-3" />
          </Button>
          <p className="text-xs text-gray-500 mt-1 text-center">Vidéo</p>
        </div>
      );
    } else {
      return (
        <div key={index} className="relative group">
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={url} 
              alt={`Media ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeMedia(index)}
          >
            <X className="h-3 w-3" />
          </Button>
          <p className="text-xs text-gray-500 mt-1 text-center">Image</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Ajouter des médias
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="h-4 w-4" />
            <span>{images.length} média{images.length > 1 ? 's' : ''} ajouté{images.length > 1 ? 's' : ''}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => getMediaPreview(url, index))}
          </div>
          
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Information :</p>
            <p>Les médias apparaîtront en bas de votre page WordPress, après le contenu textuel.</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <p>• Images : JPEG, PNG, WebP, HEIC (max 10 MB)</p>
        <p>• Vidéos : MP4, MOV, AVI, WebM (max 50 MB)</p>
        <p>• Plusieurs fichiers peuvent être sélectionnés</p>
      </div>
    </div>
  );
};

export default MediaUploader;
