
import React, { useRef, useState, useEffect } from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, XCircle, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ImageUploaderProps {
  form: UseFormReturn<any>;
}

const NetworkAwareImageUploader = ({
  form
}: ImageUploaderProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'medium' | 'fast'>('medium');
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

  // Optimized image compression adapted to network quality
  const compressAndConvertToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const settings = determineCompressionSettings();
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > settings.maxWidth) {
                height *= settings.maxWidth / width;
                width = settings.maxWidth;
              }
            } else {
              if (height > settings.maxHeight) {
                width *= settings.maxHeight / height;
                height = settings.maxHeight;
              }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error("Impossible de créer le contexte canvas"));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(blob => {
              if (!blob) {
                reject(new Error("La conversion a échoué"));
                return;
              }
              
              const fileName = file.name.split('.')[0] + '.webp';
              const newFile = new File([blob], fileName, {
                type: 'image/webp'
              });
              resolve(newFile);
            }, 'image/webp', settings.quality);
          } catch (error) {
            console.error("Erreur lors de la compression:", error);
            reject(error);
          }
        };
        img.onerror = () => {
          reject(new Error("Erreur lors du chargement de l'image"));
        };
      };
      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"));
      };
    });
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
          const processedFile = await compressAndConvertToWebp(filesToProcess[i]);
          
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

  // Contenu adapté à l'état de la connexion
  const renderOfflineState = () => (
    <div className="text-center p-4 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
      <div className="flex justify-center mb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">Mode hors ligne</h3>
      <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
        L'envoi d'images n'est pas disponible en mode hors ligne. 
        Veuillez vous reconnecter à Internet pour cette fonctionnalité.
      </p>
    </div>
  );

  return (
    <div>
      <Label>Images</Label>
      <div
        className="mt-2 border-2 border-dashed rounded-lg p-6"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Fixed input elements for file and camera */}
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
        
        {!isOnline ? (
          renderOfflineState()
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="mb-4 text-gray-950">
              {networkQuality === 'slow' ? 
                "Connexion lente détectée - Compression maximale activée" : 
                (isMobile ? 
                  "Ajoutez des photos à votre annonce" : 
                  "Glissez-déposez vos images ici, ou sélectionnez une option ci-dessous"
                )
              }
            </p>
            
            {/* Simplified mobile buttons with clear feedback */}
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
                {isMobile ? "Appareil photo" : "Prendre une photo"}
              </Button>
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {networkQuality === 'slow' 
                      ? 'Optimisation et téléversement (connexion lente)...' 
                      : 'Téléversement en cours...'}
                  </span>
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
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square">
                <OptimizedImage 
                  src={imageUrl} 
                  alt={`Image ${index + 1}`} 
                  className="h-full w-full rounded-md" 
                  aspectRatio="1/1"
                  objectFit="cover"
                />
                <button 
                  type="button" 
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" 
                  onClick={() => removeImage(index)}
                  aria-label="Supprimer l'image"
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

export default NetworkAwareImageUploader;
