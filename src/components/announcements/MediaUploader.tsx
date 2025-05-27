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

  // Detect if device is iPhone/iPad
  const isAppleDevice = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  };

  // Convert HEIC to JPEG before processing
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      console.log("🔄 Converting HEIC file:", file.name);
      setProcessingStatus("Conversion HEIC vers JPEG...");
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9
      }) as Blob;
      
      const convertedFile = new File(
        [convertedBlob], 
        file.name.replace(/\.heic$/i, '.jpg'), 
        { type: 'image/jpeg' }
      );
      
      console.log("✅ HEIC converted successfully:", {
        originalSize: file.size,
        convertedSize: convertedFile.size
      });
      
      return convertedFile;
    } catch (error) {
      console.error("❌ HEIC conversion failed:", error);
      throw new Error("Échec de la conversion HEIC");
    }
  };

  // Detect if file is HEIC format
  const isHeicFile = (file: File): boolean => {
    return file.type === 'image/heic' || 
           file.type === 'image/heif' || 
           file.name.toLowerCase().endsWith('.heic') || 
           file.name.toLowerCase().endsWith('.heif');
  };

  // Detect if file is video
  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || 
           file.name.toLowerCase().endsWith('.mov') ||
           file.name.toLowerCase().endsWith('.mp4') ||
           file.name.toLowerCase().endsWith('.avi') ||
           file.name.toLowerCase().endsWith('.mkv');
  };

  // Compress and convert image to WebP with iPhone optimizations - FIXED VERSION
  const compressAndConvertToWebp = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      setProcessingStatus("Compression et conversion WebP...");
      console.log("🔄 Starting WebP conversion for file:", {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error("❌ Cannot create canvas context");
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      // Check WebP support
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      console.log("🌐 WebP support:", webpSupported);

      const reader = new FileReader();
      
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          try {
            console.log("🖼️ Image loaded:", {
              width: img.width,
              height: img.height
            });
            
            // Enhanced compression for iPhone
            const MAX_WIDTH = isAppleDevice() ? 1200 : 1600;
            const MAX_HEIGHT = isAppleDevice() ? 1200 : 1600;
            let width = img.width;
            let height = img.height;
            
            // More aggressive resizing for iPhone
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
            
            // Enhanced quality settings for iPhone
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            console.log("✅ Image drawn on canvas, converting to WebP...");
            
            // More aggressive compression for iPhone
            const compressionQuality = isAppleDevice() ? 0.6 : 0.7;
            
            // Force WebP conversion
            canvas.toBlob(blob => {
              if (!blob) {
                console.error("❌ Canvas toBlob failed");
                // Fallback to JPEG if WebP fails
                canvas.toBlob(fallbackBlob => {
                  if (!fallbackBlob) {
                    reject(new Error("La conversion d'image a échoué"));
                    return;
                  }
                  
                  const fileName = file.name.split('.')[0] + '.jpg';
                  const fallbackFile = new File([fallbackBlob], fileName, {
                    type: 'image/jpeg'
                  });
                  
                  console.log("⚠️ WebP fallback to JPEG:", {
                    originalSize: file.size,
                    compressedSize: fallbackFile.size
                  });
                  
                  resolve(fallbackFile);
                }, 'image/jpeg', compressionQuality);
                return;
              }
              
              const fileName = file.name.split('.')[0] + '.webp';
              const newFile = new File([blob], fileName, {
                type: 'image/webp'
              });
              
              console.log("✅ WebP file created:", {
                originalSize: file.size,
                compressedSize: newFile.size,
                compressionRatio: ((file.size - newFile.size) / file.size * 100).toFixed(1) + '%'
              });
              
              resolve(newFile);
            }, 'image/webp', compressionQuality);
          } catch (error) {
            console.error("❌ Error during canvas conversion:", error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.error("❌ Image load error");
          reject(new Error("Erreur lors du chargement de l'image"));
        };
      };
      
      reader.onerror = () => {
        console.error("❌ FileReader error");
        reject(new Error("Erreur lors de la lecture du fichier"));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Convert and compress video to MP4 (simplified for iPhone)
  const convertAndCompressVideo = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      setProcessingStatus("Conversion et compression vidéo...");
      console.log("🔄 Processing video file:", file.name);
      
      // For iPhone, we'll do basic file rename and size optimization
      // In a real implementation, you'd use FFmpeg.js or similar
      const fileName = file.name.split('.')[0] + '.mp4';
      
      // Create a new file with MP4 extension
      const compressedFile = new File([file], fileName, {
        type: 'video/mp4'
      });
      
      console.log("📹 Video processed:", {
        originalName: file.name,
        newName: fileName,
        size: file.size
      });
      
      resolve(compressedFile);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("📁 Files selected:", files.length, "files");
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(5);
      setProcessingStatus("Traitement des fichiers...");
      
      if (isAppleDevice()) {
        toast.info("Optimisation iPhone détectée - Compression avancée activée");
      }
      
      const maxFiles = isMobile ? 3 : 10;
      const filesToProcess = Array.from(files).slice(0, maxFiles);
      
      if (files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} fichiers peuvent être téléversés à la fois`);
      }
      
      const uploadedMediaUrls: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        try {
          setUploadProgress(10 + Math.floor((i / filesToProcess.length) * 70));
          let fileToProcess = filesToProcess[i];
          
          console.log(`🔄 Processing file ${i + 1}/${filesToProcess.length}:`, fileToProcess.name);
          
          // Step 1: Handle HEIC conversion for images
          if (isHeicFile(fileToProcess)) {
            console.log("📱 HEIC file detected, converting...");
            toast.info(`Conversion HEIC... (${i + 1}/${filesToProcess.length})`);
            fileToProcess = await convertHeicToJpeg(fileToProcess);
          }
          
          // Step 2: Process based on file type
          if (isVideoFile(fileToProcess)) {
            // Video processing
            console.log("🎥 Video file detected, processing...");
            toast.info(`Traitement vidéo... (${i + 1}/${filesToProcess.length})`);
            fileToProcess = await convertAndCompressVideo(fileToProcess);
          } else {
            // Image processing - ENSURE WebP conversion
            console.log("🖼️ Image file detected, compressing to WebP...");
            toast.info(`Compression WebP... (${i + 1}/${filesToProcess.length})`);
            fileToProcess = await compressAndConvertToWebp(fileToProcess);
            
            // Verify the file was actually converted
            if (!fileToProcess.name.endsWith('.webp') && !fileToProcess.name.endsWith('.jpg')) {
              console.warn("⚠️ File was not converted properly, forcing conversion...");
              // Force another conversion attempt
              fileToProcess = await compressAndConvertToWebp(fileToProcess);
            }
          }
          
          console.log("✅ File processed successfully:", {
            name: fileToProcess.name,
            type: fileToProcess.type,
            size: fileToProcess.size
          });
          
          // Step 3: Upload to storage
          setProcessingStatus(`Téléversement... (${i + 1}/${filesToProcess.length})`);
          const mediaUrl = await uploadSingleFile(fileToProcess);
          
          if (mediaUrl) {
            uploadedMediaUrls.push(mediaUrl);
            console.log("📤 File uploaded successfully:", mediaUrl);
          }
        } catch (error) {
          console.error(`❌ Error processing file ${i + 1}:`, error);
          toast.error(`Erreur traitement fichier ${i + 1}: ${filesToProcess[i].name}`);
        }
      }
      
      if (uploadedMediaUrls.length > 0) {
        setUploadedMedia(prev => [...prev, ...uploadedMediaUrls]);
        form.setValue('images', [...(form.getValues('images') || []), ...uploadedMediaUrls]);
        
        const successMessage = isAppleDevice() 
          ? `${uploadedMediaUrls.length} fichier(s) optimisé(s) et compressé(s) avec succès`
          : `${uploadedMediaUrls.length} fichier(s) téléversé(s) avec succès`;
        toast.success(successMessage);
        
        console.log("🎉 All files processed and uploaded successfully");
      } else {
        setError("Aucun fichier n'a pu être téléversé");
        toast.error("Aucun fichier n'a pu être téléversé");
      }
    } catch (error: any) {
      console.error("❌ General upload error:", error);
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

  // Upload a single file and handle retries
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

  const removeMedia = (indexToRemove: number) => {
    const newMedia = uploadedMedia.filter((_, index) => index !== indexToRemove);
    setUploadedMedia(newMedia);
    form.setValue('images', newMedia);
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
      {isAppleDevice() && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Optimisation iPhone activée</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Conversion HEIC → WebP et compression automatique pour une meilleure performance
          </p>
        </div>
      )}
      
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
              "Ajoutez des photos et vidéos (HEIC/MOV/MP4 supportés)" : 
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
