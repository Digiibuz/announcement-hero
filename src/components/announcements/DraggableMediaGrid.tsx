import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { XCircle, GripVertical, FileImage, Video, Play } from "lucide-react";

interface DraggableMediaItemProps {
  id: string;
  mediaUrl: string;
  index: number;
  onRemove: (index: number) => void;
}

const DraggableMediaItem: React.FC<DraggableMediaItemProps> = ({
  id,
  mediaUrl,
  index,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getMediaType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lowerUrl = url.toLowerCase();
    
    for (const ext of videoExtensions) {
      if (lowerUrl.includes(ext)) {
        return 'video';
      }
    }
    
    return 'image';
  };

  const mediaType = getMediaType(mediaUrl);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all"
    >
      {/* Numéro d'ordre */}
      <div className="absolute top-2 left-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold z-10">
        {index + 1}
      </div>

      {/* Handle de drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-8 bg-black/50 text-white rounded p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Bouton de suppression */}
      <button
        type="button"
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
        onClick={() => onRemove(index)}
        aria-label="Supprimer le média"
      >
        <XCircle size={16} />
      </button>

      {/* Contenu média */}
      {mediaType === 'image' ? (
        <img
          src={mediaUrl}
          alt={`Média ${index + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            src={mediaUrl}
            className="h-full w-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
      )}

      {/* Icône de type de média */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white rounded-full p-1">
        {mediaType === 'image' ? (
          <FileImage className="h-3 w-3" />
        ) : (
          <Video className="h-3 w-3" />
        )}
      </div>
    </div>
  );
};

interface DraggableMediaGridProps {
  mediaUrls: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  maxItems?: number;
}

const DraggableMediaGrid: React.FC<DraggableMediaGridProps> = ({
  mediaUrls,
  onReorder,
  onRemove,
  maxItems = 5,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = mediaUrls.findIndex((url, index) => `media-${index}` === active.id);
      const newIndex = mediaUrls.findIndex((url, index) => `media-${index}` === over?.id);

      const newMediaUrls = arrayMove(mediaUrls, oldIndex, newIndex);
      onReorder(newMediaUrls);
    }
  };

  if (mediaUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          Médias ajoutés ({mediaUrls.length}/{maxItems})
        </div>
        <div className="text-xs text-gray-500">
          Glissez-déposez pour réorganiser
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={mediaUrls.map((_, index) => `media-${index}`)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mediaUrls.map((mediaUrl, index) => (
              <DraggableMediaItem
                key={`media-${index}`}
                id={`media-${index}`}
                mediaUrl={mediaUrl}
                index={index}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
        💡 <strong>Astuce :</strong> Le premier média sera l'image de couverture pour les réseaux sociaux
      </div>
    </div>
  );
};

export default DraggableMediaGrid;