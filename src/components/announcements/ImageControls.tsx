
import React from "react";
import { Button } from "@/components/ui/button";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";

interface ImageControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onResize: (size: 'small' | 'medium' | 'large' | 'full') => void;
  onAlign: (alignment: 'left' | 'center' | 'right') => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

const ImageControls = ({
  isOpen,
  onClose,
  onResize,
  onAlign,
  onDelete,
  position
}: ImageControlsProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 image-controls"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(10px, -50%)', // Position à droite de l'image
        minWidth: '200px'
      }}
    >
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Contrôles d'image</div>
        
        {/* Taille */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Taille :</div>
          <div className="flex gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-xs flex-1"
              onClick={() => onResize('small')}
            >
              Petit
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-xs flex-1"
              onClick={() => onResize('medium')}
            >
              Moyen
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-xs flex-1"
              onClick={() => onResize('large')}
            >
              Grand
            </Button>
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 text-xs w-full"
            onClick={() => onResize('full')}
          >
            Pleine largeur
          </Button>
        </div>

        {/* Alignement */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Alignement :</div>
          <div className="flex gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 w-full p-0 flex items-center justify-center gap-1"
              onClick={() => onAlign('left')}
            >
              <AlignLeft size={12} />
              <span className="text-xs">Gauche</span>
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 w-full p-0 flex items-center justify-center gap-1"
              onClick={() => onAlign('center')}
            >
              <AlignCenter size={12} />
              <span className="text-xs">Centre</span>
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-7 w-full p-0 flex items-center justify-center gap-1"
              onClick={() => onAlign('right')}
            >
              <AlignRight size={12} />
              <span className="text-xs">Droite</span>
            </Button>
          </div>
        </div>

        {/* Supprimer */}
        <div className="border-t pt-2">
          <Button 
            type="button" 
            size="sm" 
            variant="destructive" 
            className="h-7 w-full text-xs"
            onClick={onDelete}
          >
            <Trash2 size={12} className="mr-1" />
            Supprimer l'image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageControls;
