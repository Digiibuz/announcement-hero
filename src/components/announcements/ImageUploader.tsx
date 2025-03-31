
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

const ImageUploader = ({
  form
}: ImageUploaderProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.getValues('images') || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Optimized image compression for mobile
  const compressAndConvertToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Slightly reduced max dimensions for faster mobile processing
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
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
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Lower compression quality for mobile to improve speed
          const compressionQuality = 0.7;
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
          }, 'image/webp', compressionQuality);
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
      toast.info("Traitement des images en cours...");
      
      // Process files one at a time to avoid memory issues on mobile
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const processedFile = await compressAndConvertToWebp(files[i]);
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
        toast.error("Aucune image n'a pu être téléversée");
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("Erreur lors du téléversement des images: " + error.message);
    } finally {
      setIsUploading(false);
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
      
      const { data, error } = await supabase.storage.from('images').upload(filePath, file);
      
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

  // Modified uploadImages to use single image upload approach
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadSingleImage(file));
    const results = await Promise.all(uploadPromises);
    // Filter out any null results from failed uploads
    return results.filter(url => url !== null) as string[];
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

  return <div>
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
          <p className="mb-4 text-gray-950">
            Glissez-déposez vos images ici, ou sélectionnez une option ci-dessous
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={triggerFileUpload} disabled={isUploading}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Sélectionner des fichiers
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={triggerCameraUpload} disabled={isUploading}>
              <Camera className="mr-2 h-4 w-4" />
              Prendre une photo
            </Button>
          </div>
          {isUploading && <div className="mt-4 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Téléversement en cours...</span>
            </div>}
        </div>

        {uploadedImages.length > 0 && <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedImages.map((imageUrl, index) => <div key={index} className="relative group">
                <img src={imageUrl} alt={`Uploaded image ${index + 1}`} className="h-24 w-full object-cover rounded-md" />
                <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                  <XCircle size={16} />
                </button>
              </div>)}
          </div>}
      </div>
    </div>;
};

export default ImageUploader;
