import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UseFormReturn } from "react-hook-form";

interface ImageUploaderProps {
  value?: string[];
  onChange: (value: string[]) => void;
  form?: UseFormReturn<any>;
}

const ImageUploader = ({ value = [], onChange, form }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Le fichier ${file.name} dépasse la taille maximale de 5MB.`,
        });
        setIsUploading(false);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Le fichier ${file.name} n'est pas une image.`,
        });
        setIsUploading(false);
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          newImages.push(e.target.result);
          if (newImages.length === files.length) {
            onChange([...value, ...newImages]);
            setIsUploading(false);
            toast({
              title: "Succès",
              description: "Images téléchargées avec succès!",
            });
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors du téléchargement de l'image.",
        });
        setIsUploading(false);
        return;
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors 
          ${dragActive ? "border-primary bg-primary/10" : "border-border"}
          hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            {isUploading ? (
              <p>Téléchargement en cours...</p>
            ) : (
              <>
                <p className="font-medium">Cliquez ou déposez les images ici</p>
                <p>Formats acceptés: PNG, JPG, ou GIF (max 5MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-md border overflow-hidden"
            >
              <img
                src={url}
                alt={`Uploaded image ${index + 1}`}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
