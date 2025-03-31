
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onImagesChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filePromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      // Process all uploads and update state once complete
      const newImageUrls = await Promise.all(filePromises);
      onImagesChange([...images, ...newImageUrls]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative rounded-md overflow-hidden border border-gray-200">
            <img 
              src={url} 
              alt={`Uploaded image ${index + 1}`} 
              className="w-full h-48 object-cover" 
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center">
        <div className="relative w-full">
          <Input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Label
            htmlFor="image-upload"
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex flex-col items-center">
              <Upload className="h-5 w-5 mb-2" />
              <span className="text-sm font-medium">
                {isUploading ? "Téléchargement en cours..." : "Cliquez pour ajouter des images"}
              </span>
            </div>
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
