import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical, Crown, Upload, Plus, Loader2, AlertCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "./AnnouncementForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heic2any from "heic2any";

interface ImageManagementProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

interface ImageItem {
  url: string;
  selected: boolean;
  id: string;
  type: 'main' | 'additional';
}

export default function ImageManagement({ form, isMobile = false }: ImageManagementProps) {
  const [allUploadedImages, setAllUploadedImages] = useState<string[]>([]); // Stocke TOUTES les images téléchargées
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const watchedValues = form.watch();
  const { images = [], additionalMedias = [] } = watchedValues;

  // Combiner toutes les images du formulaire
  const allImages = [...(images || []), ...(additionalMedias || [])];

  // Synchroniser allUploadedImages avec les images du formulaire au premier chargement
  useEffect(() => {
    if (allImages.length > 0 && allUploadedImages.length === 0) {
      setAllUploadedImages(allImages);
    }
  }, [allImages.length]);

  // Initialiser les items d'images basé sur TOUTES les images téléchargées
  useEffect(() => {
    if (allUploadedImages.length > 0) {
      setImageItems(prevItems => {
        // Si on a déjà des items avec les mêmes URLs, ne pas réinitialiser
        if (prevItems.length === allUploadedImages.length && 
            prevItems.every(item => allUploadedImages.includes(item.url))) {
          return prevItems.map(item => ({
            ...item,
            selected: allImages.includes(item.url), // Mettre à jour le statut de sélection
            type: images.includes(item.url) ? 'main' : 'additional' as 'main' | 'additional'
          }));
        }
        
        // Créer un map des items existants pour préserver l'état
        const existingItemsMap = new Map(prevItems.map(item => [item.url, item]));
        
        return allUploadedImages.map((url, index) => {
          const existingItem = existingItemsMap.get(url);
          const isSelected = allImages.includes(url);
          const isMainImage = images.includes(url);
          return existingItem || {
            url,
            selected: isSelected,
            id: `img-${index}-${url.substring(url.length - 10)}`,
            type: isMainImage ? 'main' : 'additional' as 'main' | 'additional'
          };
        });
      });
    }
  }, [allUploadedImages.join(','), allImages.join(','), images.join(',')]);

  const handleCheckboxChange = (imageUrl: string, checked: boolean) => {
    setImageItems(prev => {
      const newItems = prev.map(item => 
        item.url === imageUrl ? { ...item, selected: checked } : item
      );
      
      // Mettre à jour le formulaire avec les nouvelles sélections
      setTimeout(() => {
        const selectedItems = newItems.filter(item => item.selected);
        if (selectedItems.length > 0) {
          form.setValue('images', [selectedItems[0].url]);
          if (selectedItems.length > 1) {
            form.setValue('additionalMedias', selectedItems.slice(1).map(item => item.url));
          } else {
            form.setValue('additionalMedias', []);
          }
        } else {
          form.setValue('images', []);
          form.setValue('additionalMedias', []);
        }
      }, 0);
      
      return newItems;
    });
  };

  // Mettre à jour les champs du formulaire quand les images changent
  const updateFormFields = () => {
    const selectedItems = imageItems.filter(item => item.selected);
    
    // La première image sélectionnée devient l'image principale
    if (selectedItems.length > 0) {
      form.setValue('images', [selectedItems[0].url]);
      
      // Le reste va dans additionalMedias
      if (selectedItems.length > 1) {
        form.setValue('additionalMedias', selectedItems.slice(1).map(item => item.url));
      } else {
        form.setValue('additionalMedias', []);
      }
    } else {
      form.setValue('images', []);
      form.setValue('additionalMedias', []);
    }
  };

  // Déclencher la mise à jour quand les images changent
  useEffect(() => {
    updateFormFields();
  }, [imageItems]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId);
    setDragOverId(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedId && draggedId !== itemId) {
      setDragOverId(itemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverId(null);
    }
  };

  const moveItem = (draggedId: string, targetId: string) => {
    setImageItems(prev => {
      const draggedIndex = prev.findIndex(item => item.id === draggedId);
      const targetIndex = prev.findIndex(item => item.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return prev;
      }
      
      const newItems = [...prev];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      
      return newItems;
    });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    moveItem(draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
    
    // Mettre à jour le formulaire après le réorganisation
    setTimeout(updateFormFields, 0);
  };

  // Check WebP support
  const checkWebPSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };

  // Convert HEIC directly to WebP
  const convertHeicToWebP = async (file: File): Promise<File> => {
    try {
      console.log("🔄 Converting HEIC to WebP:", file.name);
      setProcessingStatus("Conversion HEIC vers WebP...");
      
      const webpSupported = await checkWebPSupport();
      const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
      const extension = webpSupported ? '.webp' : '.jpg';
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: targetFormat,
        quality: 0.85
      }) as Blob;
      
      const fileName = file.name.replace(/\.heic$/i, extension);
      const convertedFile = new File(
        [convertedBlob], 
        fileName, 
        { type: targetFormat }
      );
      
      console.log("✅ HEIC to WebP conversion successful:", {
        originalSize: file.size,
        convertedSize: convertedFile.size,
        format: targetFormat,
        compressionRatio: ((file.size - convertedFile.size) / file.size * 100).toFixed(1) + '%'
      });
      
      return convertedFile;
    } catch (error) {
      console.error("❌ HEIC to WebP conversion failed:", error);
      throw new Error("Échec de la conversion HEIC vers WebP");
    }
  };

  // Detect file types
  const isHeicFile = (file: File): boolean => {
    return file.type === 'image/heic' || 
           file.type === 'image/heif' || 
           file.name.toLowerCase().endsWith('.heic') || 
           file.name.toLowerCase().endsWith('.heif');
  };

  // Convert regular images to WebP
  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise(async (resolve, reject) => {
      setProcessingStatus("Conversion vers WebP...");
      console.log("🔄 Converting to WebP:", file.name);

      const webpSupported = await checkWebPSupport();
      console.log("🌐 WebP support:", webpSupported);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          try {
            // Dimensions optimales pour le stockage
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;
            
            // Redimensionner si nécessaire
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
            
            // Dessiner l'image
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir selon le support WebP
            const targetFormat = webpSupported ? 'image/webp' : 'image/jpeg';
            const quality = 0.85;
            const extension = webpSupported ? '.webp' : '.jpg';
            
            canvas.toBlob(blob => {
              if (!blob) {
                reject(new Error("Conversion failed"));
                return;
              }
              
              const fileName = file.name.split('.')[0] + extension;
              const convertedFile = new File([blob], fileName, { type: targetFormat });
              
              console.log("✅ WebP conversion successful:", {
                originalSize: file.size,
                convertedSize: convertedFile.size,
                format: targetFormat,
                compressionRatio: ((file.size - convertedFile.size) / file.size * 100).toFixed(1) + '%'
              });
              
              resolve(convertedFile);
            }, targetFormat, quality);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
      };
      
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  // Upload single file to Supabase
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

  // Main file upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("📁 Files selected:", files.length);
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(5);
      setProcessingStatus("Préparation...");
      
      const newImageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🔄 Processing file ${i + 1}/${files.length}:`, file.name);
        
        try {
          setUploadProgress(15 + (i * 70) / files.length);
          let processedFile = file;
          
          if (isHeicFile(file)) {
            setProcessingStatus(`Conversion HEIC vers WebP... (${i + 1}/${files.length})`);
            processedFile = await convertHeicToWebP(file);
          } else {
            setProcessingStatus(`Conversion vers WebP... (${i + 1}/${files.length})`);
            processedFile = await convertToWebP(file);
          }
          
          setProcessingStatus(`Upload... (${i + 1}/${files.length})`);
          
          const imageUrl = await uploadSingleFile(processedFile);
          
          if (imageUrl) {
            newImageUrls.push(imageUrl);
            console.log(`📤 File ${i + 1} uploaded:`, imageUrl);
          } else {
            throw new Error(`Échec de l'upload du fichier ${file.name}`);
          }
        } catch (error: any) {
          console.error(`❌ Error processing file ${file.name}:`, error);
          toast.error(`Erreur avec ${file.name}: ${error.message}`);
        }
      }
      
        if (newImageUrls.length > 0) {
          // Ajouter les nouvelles images aux deux tableaux du formulaire ET au stockage local
          const currentImages = form.getValues('images') || [];
          const currentAdditional = form.getValues('additionalMedias') || [];
          
          // Mettre à jour allUploadedImages avec les nouvelles images
          setAllUploadedImages(prev => [...prev, ...newImageUrls]);
          
          // Si aucune image principale, ajouter la première à images
          if (currentImages.length === 0) {
            form.setValue('images', [newImageUrls[0]]);
            // Ajouter le reste à additionalMedias si il y en a
            if (newImageUrls.length > 1) {
              const updatedAdditional = [...currentAdditional, ...newImageUrls.slice(1)];
              form.setValue('additionalMedias', updatedAdditional);
            }
          } else {
            // Sinon, ajouter toutes les nouvelles images à additionalMedias
            const updatedAdditional = [...currentAdditional, ...newImageUrls];
            form.setValue('additionalMedias', updatedAdditional);
          }
        
        // Notification removed as requested
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
    }
  };

  const selectedImages = imageItems.filter(item => item.selected);
  const mainImage = selectedImages.find(item => item.type === 'main');
  const firstSelectedImage = selectedImages[0];

  return (
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader className={isMobile ? "px-0 pt-0" : ""}>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gestion des images ({selectedImages.length})
        </CardTitle>
        {!isMobile && (
          <p className="text-sm text-muted-foreground">
            Ajoutez vos images puis organisez-les par ordre d'importance.
          </p>
        )}
      </CardHeader>
      <CardContent className={isMobile ? "px-0 pb-0" : ""}>
        <div className="space-y-6">
          {/* Bouton d'ajout d'images */}
          <div 
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/20 transition-all duration-200 cursor-pointer group"
            onClick={() => {
              // Trigger le click sur l'input file caché
              document.getElementById('image-upload-input')?.click();
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
                  Ajouter des images
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, HEIC - Max 10 MB par fichier
                </p>
              </div>
            </div>
            
            {/* Input file caché */}
            <input
              id="image-upload-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Indicateur de chargement */}
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
          
          {/* Erreur */}
          {error && !isUploading && (
            <div className="mt-4 text-red-500 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Section organisation (seulement si des images existent) */}
          {/* Grille des images */}
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {imageItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`
                  relative group cursor-move border-2 rounded-lg overflow-hidden transition-all duration-200
                  ${item.selected ? 'border-primary' : 'border-muted'}
                  ${draggedId === item.id ? 'opacity-50 scale-95' : ''}
                  ${dragOverId === item.id ? 'border-blue-500 border-dashed scale-105' : ''}
                  hover:shadow-md
                `}
              >
                {/* Badge d'ordre et statut */}
                <div className="absolute top-2 left-2 z-10 flex gap-1">
                  {item.selected && (
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="text-xs flex items-center gap-1"
                    >
                      {selectedImages.findIndex(si => si.id === item.id) + 1}
                      {index === 0 && (
                        <Crown className="h-3 w-3" />
                      )}
                    </Badge>
                  )}
                  
                  {item.type === 'main' && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Principal
                    </Badge>
                  )}
                </div>

                {/* Icône de glissement */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="absolute bottom-2 left-2 z-10">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(item.url, checked as boolean)
                    }
                    className="bg-white border-2"
                  />
                </div>

                {/* Image */}
                <div className="aspect-square bg-muted">
                  <img
                    src={item.url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Overlay pour les images non sélectionnées */}
                {!item.selected && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium">
                      Non utilisée
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Informations sur l'organisation */}
          {selectedImages.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Image principale :</span>
                <span className="text-muted-foreground">
                  {firstSelectedImage ? 
                    `Image ${selectedImages.indexOf(firstSelectedImage) + 1} sera l'image de couverture` :
                    "Aucune image sélectionnée"
                  }
                </span>
              </div>
              
              {mainImage && firstSelectedImage?.id !== mainImage.id && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ L'image marquée "Principal" n'est pas en première position. 
                  La première image dans l'ordre sera utilisée comme couverture.
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-900 mb-1">💡 Instructions :</p>
            <p>• Cochez les images que vous souhaitez utiliser</p>
            <p>• Glissez-déposez pour changer l'ordre d'importance</p>
            <p>• La première image (👑) sera l'image de couverture principale</p>
            <p>• Les autres images apparaîtront comme images additionnelles</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}