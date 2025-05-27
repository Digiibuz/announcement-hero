import React, { useRef, useState } from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ImageUploaderProps {
  form: UseFormReturn<any>;
}

const ImageUploader = ({
  form
}: ImageUploaderProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Optimized image compression for mobile with detailed logging
  const compressAndConvertToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log("🔄 Starting conversion for file:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Check if browser supports WebP
      const canvas = document.createElement('canvas');
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      console.log("🌐 WebP support:", webpSupported);

      const reader = new FileReader();
      
      reader.onload = event => {
        console.log("📖 FileReader loaded successfully");
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          try {
            console.log("🖼️ Image loaded:", {
              width: img.width,
              height: img.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            });
            
            // Lower max dimensions for mobile to improve performance
            const MAX_WIDTH = isMobile ? 1200 : 1600;
            const MAX_HEIGHT = isMobile ? 1200 : 1600;
            let width = img.width;
            let height = img.height;
            
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
            
            console.log("📏 Resized dimensions:", { width, height });
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error("❌ Cannot create canvas context");
              reject(new Error("Impossible de créer le contexte canvas"));
              return;
            }
            
            console.log("🎨 Canvas context created successfully");
            
            // Clear canvas and draw image
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            console.log("✅ Image drawn on canvas");
            
            // Lower compression quality on mobile
            const compressionQuality = isMobile ? 0.65 : 0.7;
            console.log("🗜️ Compression quality:", compressionQuality);
            
            canvas.toBlob(blob => {
              if (!blob) {
                console.error("❌ Canvas toBlob failed - no blob returned");
                reject(new Error("La conversion en WebP a échoué"));
                return;
              }
              
              console.log("✅ WebP blob created:", {
                size: blob.size,
                type: blob.type,
                originalSize: file.size,
                compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1) + '%'
              });
              
              const fileName = file.name.split('.')[0] + '.webp';
              const newFile = new File([blob], fileName, {
                type: 'image/webp'
              });
              
              console.log("🎉 WebP file created successfully:", {
                name: newFile.name,
                size: newFile.size,
                type: newFile.type
              });
              
              resolve(newFile);
            }, 'image/webp', compressionQuality);
          } catch (error) {
            console.error("❌ Error during canvas conversion:", error);
            reject(error);
          }
        };
        
        img.onerror = (errorEvent) => {
          console.error("❌ Image load error:", errorEvent);
          reject(new Error("Erreur lors du chargement de l'image"));
        };
      };
      
      reader.onerror = (errorEvent) => {
        console.error("❌ FileReader error:", errorEvent);
        reject(new Error("Erreur lors de la lecture du fichier"));
      };
      
      try {
        reader.readAsDataURL(file);
        console.log("📖 Starting FileReader.readAsDataURL");
      } catch (error) {
        console.error("❌ Error starting FileReader:", error);
        reject(error);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("📁 Files selected:", files.length, "files");
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(10);
      toast.info("Traitement des images en cours...");
      
      // Limite le nombre d'images sur mobile pour éviter les problèmes de mémoire
      const maxFiles = isMobile ? 3 : 10;
      const filesToProcess = Array.from(files).slice(0, maxFiles);
      
      console.log("🔢 Processing", filesToProcess.length, "files (max:", maxFiles, ")");
      
      if (files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} images peuvent être téléversées à la fois sur mobile`);
      }
      
      // Processus séquentiel pour éviter de surcharger l'appareil mobile
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        try {
          console.log(`🔄 Processing file ${i + 1}/${filesToProcess.length}:`, filesToProcess[i].name);
          setUploadProgress(10 + Math.floor((i / filesToProcess.length) * 40));
          
          const processedFile = await compressAndConvertToWebp(filesToProcess[i]);
          console.log("✅ File processed successfully:", processedFile.name);
          
          setUploadProgress(50 + Math.floor((i / filesToProcess.length) * 40));
          const imageUrl = await uploadSingleImage(processedFile);
          
          if (imageUrl) {
            uploadedImageUrls.push(imageUrl);
            console.log("📤 File uploaded successfully:", imageUrl);
          } else {
            console.warn("⚠️ Upload returned null for file:", processedFile.name);
          }
        } catch (error) {
          console.error(`❌ Error processing file ${i + 1}:`, filesToProcess[i].name, error);
          
          // Essayer l'upload sans conversion en cas d'erreur
          try {
            console.log("🔄 Trying to upload original file without conversion...");
            const imageUrl = await uploadSingleImage(filesToProcess[i]);
            if (imageUrl) {
              uploadedImageUrls.push(imageUrl);
              console.log("✅ Original file uploaded successfully:", imageUrl);
              toast.warning(`Image ${i + 1} uploadée sans conversion WebP`);
            }
          } catch (uploadError) {
            console.error("❌ Failed to upload original file:", uploadError);
          }
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
      console.error("❌ General upload error:", error);
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
      
      console.log(`📤 Uploading file ${file.name} to path ${filePath}`);
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) {
        console.error("❌ Storage upload error:", error);
        if (retries > 0) {
          console.log(`🔄 Retrying upload... (${retries} attempts left)`);
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return uploadSingleImage(file, retries - 1);
        }
        throw error;
      }
      
      console.log("✅ Upload successful, getting public URL");
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      console.log("🔗 Public URL obtained:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Upload failed after retries:", error);
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

  // Support du glisser-déposer (non utilisé sur mobile)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return; // Désactivé sur mobile
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return; // Désactivé sur mobile
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
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="mb-4 text-gray-950">
            {isMobile ? 
              "Ajoutez des photos à votre annonce" : 
              "Glissez-déposez vos images ici, ou sélectionnez une option ci-dessous"
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
                <span className="text-sm">Téléversement en cours...</span>
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

        {uploadedImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square">
                <img 
                  src={imageUrl} 
                  alt={`Image ${index + 1}`} 
                  className="h-full w-full object-cover rounded-md" 
                  loading="lazy"
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

export default ImageUploader;
