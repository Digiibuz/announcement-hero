
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MediaInsertionProps {
  onInsertImage: (url: string, alt?: string) => void;
  onInsertVideo: (embedCode: string) => void;
}

const MediaInsertion = ({ onInsertImage, onInsertVideo }: MediaInsertionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else if (file.type.startsWith('video/')) {
      // For now, we only support YouTube/Vimeo URLs for videos
      toast.error("Pour les vidéos, veuillez utiliser un lien YouTube ou Vimeo");
    } else {
      toast.error("Type de fichier non supporté. Veuillez sélectionner une image");
    }

    // Reset the input
    event.target.value = '';
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image valide");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La taille de l'image ne doit pas dépasser 10 MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);

      onInsertImage(publicUrl, file.name.split('.')[0]);
      toast.success("Image ajoutée avec succès");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Upload size={16} className="animate-spin" />
            <span>Upload...</span>
          </>
        ) : (
          <>
            <ImageIcon size={16} />
            <span>Média</span>
          </>
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default MediaInsertion;
