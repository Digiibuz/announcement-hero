
import { useState, useRef, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { compressAndConvertToWebp } from "./image-compression";

export function useNetworkAwareImageUploader(form: UseFormReturn<any>) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [processingCount, setProcessingCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Surveillance de l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérifier et mettre à jour la qualité réseau
    const updateNetworkQuality = () => {
      if (window.getNetworkQuality) {
        setNetworkQuality(window.getNetworkQuality());
      }
    };
    
    updateNetworkQuality();
    
    // Mettre à jour en cas de changement de réseau
    window.addEventListener('networkchange', updateNetworkQuality);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkchange', updateNetworkQuality);
    };
  }, []);

  // Déterminer la compression optimale selon le réseau et l'appareil
  const determineCompressionSettings = () => {
    // Sur réseau très lent, maximum de compression
    if (networkQuality === 'slow') {
      return {
        maxWidth: isMobile ? 800 : 1000,
        maxHeight: isMobile ? 800 : 1000,
        quality: 0.5
      };
    }
    
    // Sur réseau moyen, compression moyenne
    if (networkQuality === 'medium') {
      return {
        maxWidth: isMobile ? 1000 : 1400, 
        maxHeight: isMobile ? 1000 : 1400,
        quality: 0.65
      };
    }
    
    // Sur réseau rapide, compression minimale
    return {
      maxWidth: isMobile ? 1200 : 1600,
      maxHeight: isMobile ? 1200 : 1600, 
      quality: isMobile ? 0.7 : 0.8
    };
  };

  // Enhanced upload management adapted to network quality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Vérifier si en ligne
    if (!isOnline) {
      toast.error("Vous êtes hors ligne", {
        description: "L'envoi d'images n'est pas possible sans connexion internet."
      });
      return;
    }
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(5);
      
      // Message adapté à la qualité réseau
      if (networkQuality === 'slow') {
        toast.info("Connexion lente détectée. Compression maximale activée", {
          duration: 5000,
        });
      } else {
        toast.info("Traitement des images en cours...");
      }
      
      // Nombre d'images adapté à la performance réseau et appareil
      const maxFiles = networkQuality === 'slow' ? 2 : 
                      (networkQuality === 'medium' ? 3 : 
                      (isMobile ? 4 : 10));
                      
      const filesToProcess = Array.from(files).slice(0, maxFiles);
      
      // Update processing count to show skeletons
      setProcessingCount(filesToProcess.length);
      
      if (files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} images peuvent être téléversées à la fois sur votre connexion actuelle`);
      }
      
      // Processus séquentiel pour éviter de surcharger l'appareil mobile
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        try {
          setUploadProgress(5 + Math.floor((i / filesToProcess.length) * 45));
          
          // Compression adaptative selon la qualité réseau
          console.log(`Compression image ${i+1}/${filesToProcess.length} avec paramètres réseau ${networkQuality}`);
          const settings = determineCompressionSettings();
          const processedFile = await compressAndConvertToWebp(filesToProcess[i], settings);
          
          setUploadProgress(50 + Math.floor((i / filesToProcess.length) * 45));
          
          // Uploader avec stratégie de retry adapté à la qualité réseau
          const maxRetries = networkQuality === 'slow' ? 3 : 
                           (networkQuality === 'medium' ? 2 : 1);
                           
          const imageUrl = await uploadSingleImage(processedFile, maxRetries);
          
          if (imageUrl) {
            uploadedImageUrls.push(imageUrl);
          }
        } catch (error) {
          console.error("Erreur de traitement pour l'image", i, error);
          // On continue avec les autres images si une échoue
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
      setProcessingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Upload a single image with network-aware retry strategy
  const uploadSingleImage = async (file: File, retries = 2): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      
      console.log(`Uploading file ${file.name} to path ${filePath} (retries left: ${retries})`);
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) {
        console.error("Storage upload error:", error);
        if (retries > 0) {
          console.log(`Retrying upload... (${retries} attempts left)`);
          // Wait a moment before retrying, longer wait for slow networks
          const retryDelay = networkQuality === 'slow' ? 2000 : 
                            (networkQuality === 'medium' ? 1000 : 500);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
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
    if (!isOnline) {
      toast.error("Vous êtes hors ligne", {
        description: "L'envoi d'images n'est pas possible sans connexion internet."
      });
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraUpload = () => {
    if (!isOnline) {
      toast.error("Vous êtes hors ligne", {
        description: "L'envoi d'images n'est pas possible sans connexion internet."
      });
      return;
    }
    
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Support du glisser-déposer (non utilisé sur mobile)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile || !isOnline) return; // Désactivé sur mobile ou hors ligne
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile || !isOnline) return; // Désactivé sur mobile ou hors ligne
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
    isOnline,
    networkQuality,
    processingCount,
    handleFileUpload,
    removeImage,
    fileInputRef,
    cameraInputRef,
    triggerFileUpload,
    triggerCameraUpload,
    handleDragOver,
    handleDrop
  };
}
