
import React from "react";
import { ImageIcon, Camera, UploadCloud, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

interface UploadZoneProps {
  isOnline: boolean;
  isUploading: boolean;
  uploadProgress: number;
  networkQuality: 'slow' | 'medium' | 'fast';
  error: string | null;
  triggerFileUpload: () => void;
  triggerCameraUpload: () => void;
}

export function UploadZone({
  isOnline,
  isUploading,
  uploadProgress,
  networkQuality,
  error,
  triggerFileUpload,
  triggerCameraUpload
}: UploadZoneProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  
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

  if (!isOnline) {
    return renderOfflineState();
  }

  return (
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
  );
}
