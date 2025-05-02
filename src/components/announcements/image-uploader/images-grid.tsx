
import React from "react";
import { XCircle } from "lucide-react";

interface ImagesGridProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function ImagesGrid({ images, onRemove }: ImagesGridProps) {
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
    </div>
  );
}
