
import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { compressImage } from "./compression-utils";

export function useImageUploader(form: UseFormReturn<any>) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(10);
      toast.info("Traitement des images en cours...");
      
      // Limit number of files on mobile to avoid memory issues
      const maxFiles = isMobile ? 3 : 10;
      const filesToProcess = Array.from(files).slice(0, maxFiles);
      
      if (files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} images peuvent être téléversées à la fois sur mobile`);
      }
      
      // Sequential process to avoid overloading mobile devices
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        try {
          setUploadProgress(10 + Math.floor((i / filesToProcess.length) * 40));
          const processedFile = await compressImage(filesToProcess[i], isMobile);
          
          setUploadProgress(50 + Math.floor((i / filesToProcess.length) * 40));
          const imageUrl = await uploadSingleImage(processedFile);
          
          if (imageUrl) {
            uploadedImageUrls.push(imageUrl);
          }
        } catch (error) {
          console.error("Erreur de traitement pour l'image", i, error);
          // Continue with other images if one fails
        }
      }
      
      if (uploadedImageUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadedImageUrls]);
        form.setValue('images', [...(form.getValues('images') || []), ...uploadedImageUrls]);
        toast.success(`${uploadedImageUrls.length} image(s) téléversée(s) avec succès`);
      } else {
        setError("Aucune image n'a pu être téléversée. Veuillez réessayer.");
        toast.error("Aucune image n'a pu être téléversée");
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      setError(error.message || "Erreur lors du téléversement");
      toast.error("Erreur lors du téléversement des images: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Upload a single image and handle retries
  const uploadSingleImage = async (file: File, retries = 2): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      console.log(`Uploading file ${file.name} to path ${filePath}`);
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) {
        console.error("Storage upload error:", error);
        if (retries > 0) {
          console.log(`Retrying upload... (${retries} attempts left)`);
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return uploadSingleImage(file, retries - 1);
        }
        throw error;
      }
      
      console.log("Upload successful, getting public URL");
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      console.log("Public URL obtained:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload failed after retries:", error);
      return null;
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  // Fixed mobile camera handling
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

  // Drag and drop support (disabled on mobile)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return; // Disabled on mobile
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return; // Disabled on mobile
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dataTransfer = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach(file => {
        dataTransfer.items.add(file);
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  return {
    uploadedImages,
    isUploading,
    uploadProgress,
    error,
    handleFileUpload,
    removeImage,
    fileInputRef,
    cameraInputRef,
    triggerFileUpload,
    triggerCameraUpload,
    handleDragOver,
    handleDrop,
    isMobile
  };
}
