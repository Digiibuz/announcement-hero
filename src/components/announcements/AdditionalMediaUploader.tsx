import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { ImageIcon, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import heic2any from "heic2any";
import DraggableMediaGrid from "./DraggableMediaGrid";

interface AdditionalMediaUploaderProps {
  form: UseFormReturn<any>;
}

export interface AdditionalMediaUploaderRef {
  triggerUpload: () => void;
}

const AdditionalMediaUploader = forwardRef<AdditionalMediaUploaderRef, AdditionalMediaUploaderProps>(({ form }, ref) => {
  const [uploadedMedias, setUploadedMedias] = useState<string[]>(form.getValues('additionalMedias') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Expose the trigger function to parent component
  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }));

  // Check WebP support
  const checkWebPSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };

  // Convert HEIC directly to WebP
  const convertHeicToWebP = async (file: File): Promise<File> => {
    try {
      console.log("🔄 Converting HEIC to WebP:", file.name);
      setProcessingStatus("Conversion HEIC vers WebP...");
      
      const webpSupported = await checkWebPSupport();
      const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
      const extension = webpSupported ? '.webp' : '.jpg';
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: targetFormat,
        quality: 0.85
      }) as Blob;
      
      const fileName = file.name.replace(/\.heic$/i, extension);
      const convertedFile = new File(
        [convertedBlob], 
        fileName, 
        { type: targetFormat }
      );
      
      console.log("✅ HEIC to WebP conversion successful:", {
        originalSize: file.size,
        convertedSize: convertedFile.size,
        format: targetFormat,
        compressionRatio: ((file.size - convertedFile.size) / file.size * 100).toFixed(1) + '%'
      });
      
      return convertedFile;
    } catch (error) {
      console.error("❌ HEIC to WebP conversion failed:", error);
      throw new Error("Échec de la conversion HEIC vers WebP");
    }
  };

  // Detect file types
  const isHeicFile = (file: File): boolean => {
    return file.type === 'image/heic' || 
           file.type === 'image/heif' || 
           file.name.toLowerCase().endsWith('.heic') || 
           file.name.toLowerCase().endsWith('.heif');
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') || isHeicFile(file);
  };

  // Convert regular images to WebP
  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise(async (resolve, reject) => {
      setProcessingStatus("Conversion vers WebP...");
      console.log("🔄 Converting to WebP:", file.name);

      const webpSupported = await checkWebPSupport();
      console.log("🌐 WebP support:", webpSupported);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          try {
            // Dimensions optimales pour le stockage
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;
            
            // Redimensionner si nécessaire
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dessiner l'image
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir selon le support WebP
            const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
            const quality = 0.85;
            const extension = webpSupported ? '.webp' : '.jpg';
            
            canvas.toBlob(blob => {
              if (!blob) {
                reject(new Error("Conversion failed"));
                return;
              }
              
              const fileName = file.name.split('.')[0] + extension;
              const convertedFile = new File([blob], fileName, { type: targetFormat });
              
              console.log("✅ WebP conversion successful:", {
                originalSize: file.size,
                convertedSize: convertedFile.size,
                format: targetFormat,
                compressionRatio: ((file.size - convertedFile.size) / file.size * 100).toFixed(1) + '%'
              });
              
              resolve(convertedFile);
            }, targetFormat, quality);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
      };
      
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  // Main file upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("📁 Files selected:", files.length);
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(5);
      setProcessingStatus("Préparation...");
      
      const newMediaUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🔄 Processing file ${i + 1}/${files.length}:`, file.name);
        
        try {
          setUploadProgress(15 + (i * 70) / files.length);
          let processedFile = file;
          
          if (isImageFile(file)) {
            if (isHeicFile(file)) {
              setProcessingStatus(`Conversion HEIC vers WebP... (${i + 1}/${files.length})`);
              processedFile = await convertHeicToWebP(file);
            } else {
              setProcessingStatus(`Conversion vers WebP... (${i + 1}/${files.length})`);
              processedFile = await convertToWebP(file);
            }
          } else if (isVideoFile(file)) {
            setProcessingStatus(`Préparation vidéo... (${i + 1}/${files.length})`);
            // Les vidéos sont uploadées telles quelles
          } else {
            throw new Error(`Type de fichier non supporté: ${file.type}`);
          }
          
          setProcessingStatus(`Upload... (${i + 1}/${files.length})`);
          
          const mediaUrl = await uploadSingleFile(processedFile);
          
          if (mediaUrl) {
            newMediaUrls.push(mediaUrl);
            console.log(`📤 File ${i + 1} uploaded:`, mediaUrl);
          } else {
            throw new Error(`Échec de l'upload du fichier ${file.name}`);
          }
        } catch (error: any) {
          console.error(`❌ Error processing file ${file.name}:`, error);
          toast.error(`Erreur avec ${file.name}: ${error.message}`);
        }
      }
      
      if (newMediaUrls.length > 0) {
        const updatedMedias = [...uploadedMedias, ...newMediaUrls];
        setUploadedMedias(updatedMedias);
        form.setValue('additionalMedias', updatedMedias);
        
        toast.success(`${newMediaUrls.length} média(s) téléversé(s) avec succès`);
      }
      
    } catch (error: any) {
      console.error("❌ General upload error:", error);
      setError(error.message || "Erreur lors du téléversement");
      toast.error("Erreur: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStatus("");
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload single file to Supabase
  const uploadSingleFile = async (file: File, retries = 2): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      console.log(`📤 Uploading ${file.type} file: ${file.name} (${file.size} bytes)`);
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) {
        if (retries > 0) {
          console.log(`🔄 Retrying upload... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return uploadSingleFile(file, retries - 1);
        }
        throw error;
      }
      
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      console.log("✅ Upload successful:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Upload failed:", error);
      return null;
    }
  };

  // Remove media
  const removeMedia = (indexToRemove: number) => {
    const updatedMedias = uploadedMedias.filter((_, index) => index !== indexToRemove);
    setUploadedMedias(updatedMedias);
    form.setValue('additionalMedias', updatedMedias);
  };

  // Reorder medias
  const reorderMedias = (newOrder: string[]) => {
    setUploadedMedias(newOrder);
    form.setValue('additionalMedias', newOrder);
  };

  // UI event handlers
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*,video/*,.heic,.heif" 
        multiple
        className="hidden" 
        onChange={handleFileUpload} 
      />
      
      {/* Zone d'upload toujours visible */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="mb-4 text-gray-950">
            Glissez-déposez vos médias ici ou cliquez pour sélectionner
          </p>
          <Button 
            type="button" 
            variant="outline" 
            onClick={triggerFileUpload} 
            disabled={isUploading}
            className="gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            {uploadedMedias.length > 0 ? "Ajouter plus de médias" : "Sélectionner des médias"}
          </Button>
          {uploadedMedias.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {uploadedMedias.length}/5 médias ajoutés
            </p>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{processingStatus || "Traitement en cours..."}</span>
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      
      {error && !isUploading && (
        <div className="mb-4 text-red-500 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Display uploaded medias using DraggableMediaGrid */}
      <DraggableMediaGrid
        mediaUrls={uploadedMedias}
        onReorder={reorderMedias}
        onRemove={removeMedia}
        maxItems={5}
      />
    </div>
  );
});

AdditionalMediaUploader.displayName = "AdditionalMediaUploader";

export default AdditionalMediaUploader;
