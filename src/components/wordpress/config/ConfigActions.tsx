
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { WordPressConfig } from "@/types/wordpress";

interface ConfigActionsProps {
  config: WordPressConfig;
  onEdit: (config: WordPressConfig) => void;
  onDelete: (id: string) => Promise<void>;
}

const ConfigActions: React.FC<ConfigActionsProps> = ({ config, onEdit, onDelete }) => {
  return (
    <div className="flex justify-end gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(config)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Modifier
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(config.id)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </Button>
    </div>
  );
};

export default ConfigActions;
