
import React from "react";
import { XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImagesGridProps {
  images: string[];
  onRemove: (index: number) => void;
  processingImages?: boolean;
  processingCount?: number;
}

export function ImagesGrid({ 
  images, 
  onRemove, 
  processingImages = false,
  processingCount = 0
}: ImagesGridProps) {
  // Generate skeleton placeholders for processing images
  const renderSkeletons = () => {
    return Array.from({ length: processingCount }).map((_, index) => (
      <div key={`skeleton-${index}`} className="relative group aspect-square">
        <Skeleton className="h-full w-full rounded-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Processing...
          </span>
        </div>
      </div>
    ));
  };

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((imageUrl, index) => (
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
            onClick={() => onRemove(index)}
            aria-label="Supprimer l'image"
          >
            <XCircle size={16} />
          </button>
        </div>
      ))}
      
      {processingImages && renderSkeletons()}
    </div>
  );
}
