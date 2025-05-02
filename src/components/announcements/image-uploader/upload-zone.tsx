
import React from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  triggerFileUpload: () => void;
  triggerCameraUpload: () => void;
  isMobile: boolean;
}

export function UploadZone({
  isUploading,
  uploadProgress,
  error,
  triggerFileUpload,
  triggerCameraUpload,
  isMobile
}: UploadZoneProps) {
  return (
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
  );
}
