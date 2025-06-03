
import React, { useRef, useState } from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, XCircle, AlertCircle, Video, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import heic2any from "heic2any";

interface MediaUploaderProps {
  form: UseFormReturn<any>;
}

const MediaUploader = ({
  form
}: MediaUploaderProps) => {
  const [uploadedMedia, setUploadedMedia] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

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
    return file.type.startsWith('video/') || 
           file.name.toLowerCase().endsWith('.mov') ||
           file.name.toLowerCase().endsWith('.mp4') ||
           file.name.toLowerCase().endsWith('.avi') ||
           file.name.toLowerCase().endsWith('.mkv');
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

  // Process video files
  const processVideo = async (file: File): Promise<File> => {
    setProcessingStatus("Traitement vidéo...");
    console.log("🎥 Processing video:", file.name);
    
    const fileName = file.name.split('.')[0] + '.mp4';
    return new File([file], fileName, { type: 'video/mp4' });
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
      
      const maxFiles = isMobile ? 3 : 10;
      const filesToProcess = Array.from(files).slice(0, maxFiles);
      
      if (files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} fichiers à la fois`);
      }
      
      const uploadedMediaUrls: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        try {
          setUploadProgress(10 + Math.floor((i / filesToProcess.length) * 80));
          let fileToProcess = filesToProcess[i];
          
          console.log(`🔄 Processing file ${i + 1}/${filesToProcess.length}:`, fileToProcess.name);
          
          // Traitement selon le type de fichier
          if (isHeicFile(fileToProcess)) {
            fileToProcess = await convertHeicToWebP(fileToProcess);
          } else if (isVideoFile(fileToProcess)) {
            fileToProcess = await processVideo(fileToProcess);
          } else {
            fileToProcess = await convertToWebP(fileToProcess);
          }
          
          // Upload vers Supabase
          setProcessingStatus(`Upload... (${i + 1}/${filesToProcess.length})`);
          const mediaUrl = await uploadSingleFile(fileToProcess);
          
          if (mediaUrl) {
            uploadedMediaUrls.push(mediaUrl);
            console.log("📤 File uploaded:", mediaUrl);
          }
        } catch (error) {
          console.error(`❌ Error processing file ${i + 1}:`, error);
          toast.error(`Erreur fichier ${i + 1}: ${filesToProcess[i].name}`);
        }
      }
      
      if (uploadedMediaUrls.length > 0) {
        setUploadedMedia(prev => [...prev, ...uploadedMediaUrls]);
        form.setValue('images', [...(form.getValues('images') || []), ...uploadedMediaUrls]);
        
        toast.success(`${uploadedMediaUrls.length} fichier(s) traité(s) et téléversé(s)`);
        console.log("🎉 All files processed successfully");
      } else {
        setError("Aucun fichier n'a pu être téléversé");
        toast.error("Aucun fichier téléversé");
      }
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      setError(error.message || "Erreur lors du téléversement");
      toast.error("Erreur: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStatus("");
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
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
    const newMedia = uploadedMedia.filter((_, index) => index !== indexToRemove);
    setUploadedMedia(newMedia);
    form.setValue('images', newMedia);
  };

  // UI event handlers
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

  // Detect if device is Android
  const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return;
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

  const getFileIcon = (url: string) => {
    if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi')) {
      return <Video className="h-4 w-4" />;
    }
    return <FileImage className="h-4 w-4" />;
  };

  return (
    <div>
      <Label>Images et Vidéos</Label>
      
      <div
        className="mt-2 border-2 border-dashed rounded-lg p-6"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*,video/*,.heic,.heif,.mov" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          accept="image/*,video/*,.heic,.heif" 
          capture={isAndroid() ? "camera" : "environment"}
          className="hidden" 
          onChange={handleFileUpload} 
        />
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="mb-4 text-gray-950">
            {isMobile ? 
              "Ajoutez votre image ou photo" : 
              "Glissez-déposez vos fichiers ici, ou sélectionnez une option ci-dessous"
            }
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={triggerFileUpload} 
              disabled={isUploading}
              className="flex-1"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isMobile ? "Galerie" : "Sélectionner des fichiers"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={triggerCameraUpload} 
              disabled={isUploading}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              {isMobile ? "Appareil photo" : "Prendre une photo/vidéo"}
            </Button>
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{processingStatus || "Traitement en cours..."}</span>
              </div>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {error && !isUploading && (
            <div className="mt-4 text-red-500 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {uploadedMedia.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedMedia.map((mediaUrl, index) => (
              <div key={index} className="relative group aspect-square">
                {mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') ? (
                  <video 
                    src={mediaUrl} 
                    className="h-full w-full object-cover rounded-md" 
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={mediaUrl} 
                    alt={`Media ${index + 1}`} 
                    className="h-full w-full object-cover rounded-md" 
                    loading="lazy"
                  />
                )}
                <div className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1">
                  {getFileIcon(mediaUrl)}
                </div>
                <button 
                  type="button" 
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" 
                  onClick={() => removeMedia(index)}
                  aria-label="Supprimer le fichier"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;
