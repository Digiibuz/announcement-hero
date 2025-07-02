
import React from "react";
import { Button } from "@/components/ui/button";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex flex-col gap-2">
        {/* Taille */}
        <div className="flex gap-1">
          <span className="text-xs text-gray-500 min-w-12">Taille:</span>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onResize('small')}
          >
            S
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onResize('medium')}
          >
            M
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onResize('large')}
          >
            L
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs"
            onClick={() => onResize('full')}
          >
            100%
          </Button>
        </div>

        {/* Alignement */}
        <div className="flex gap-1">
          <span className="text-xs text-gray-500 min-w-12">Align:</span>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0"
            onClick={() => onAlign('left')}
          >
            <AlignLeft size={12} />
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0"
            onClick={() => onAlign('center')}
          >
            <AlignCenter size={12} />
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0"
            onClick={() => onAlign('right')}
          >
            <AlignRight size={12} />
          </Button>
        </div>

        {/* Supprimer */}
        <div className="border-t pt-1">
          <Button 
            type="button" 
            size="sm" 
            variant="destructive" 
            className="h-6 w-full text-xs"
            onClick={onDelete}
          >
            <Trash2 size={12} className="mr-1" />
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageControls;
