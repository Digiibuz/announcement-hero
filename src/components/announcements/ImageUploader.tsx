
import React, { useRef, useState } from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

interface ImageUploaderProps {
  form: UseFormReturn<any>;
}

const ImageUploader = ({ form }: ImageUploaderProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour compresser et convertir l'image en WebP
  const compressAndConvertToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Créer un canvas pour le redimensionnement et la conversion
          const canvas = document.createElement('canvas');
          
          // Définir une taille maximale raisonnable (1920px) tout en conservant le ratio
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
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
          
          canvas.width = width;
          canvas.height = height;
          
          // Dessiner l'image redimensionnée sur le canvas
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convertir en WebP avec une qualité de 80%
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("La conversion a échoué"));
              return;
            }
            
            // Créer un nouveau fichier au format WebP avec le même nom mais extension changée
            const fileName = file.name.split('.')[0] + '.webp';
            const newFile = new File([blob], fileName, { type: 'image/webp' });
            
            resolve(newFile);
          }, 'image/webp', 0.8); // 0.8 = 80% de qualité
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      
      // Compresser et convertir chaque image avant l'upload
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            return await compressAndConvertToWebp(file);
          } catch (error) {
            console.error("Erreur de compression:", error);
            // En cas d'erreur de compression, utiliser le fichier original
            return file;
          }
        })
      );
      
      const uploadedImageUrls = await uploadImages(processedFiles);
      
      setUploadedImages(prev => [...prev, ...uploadedImageUrls]);
      form.setValue('images', [...form.getValues('images') || [], ...uploadedImageUrls]);
      
      toast.success(`${uploadedImageUrls.length} image(s) téléversée(s) avec succès`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("Erreur lors du téléversement des images: " + error.message);
    } finally {
      setIsSubmitting(false);
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
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
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
    <div>
      <Label>Images</Label>
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
  );
};

export default ImageUploader;
