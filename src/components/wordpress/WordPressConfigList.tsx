
import React from "react";
import { WordPressConfig } from "@/types/wordpress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import WordPressConnectionStatus from "./WordPressConnectionStatus";
import WordPressConfigForm from "./WordPressConfigForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WordPressConfigItem = ({ 
  config, 
  onEdit, 
  onDelete, 
  readOnly = false 
}: { 
  config: WordPressConfig, 
  onEdit?: (id: string) => void, 
  onDelete?: (id: string) => void,
  readOnly?: boolean
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(config.id);
    } else {
      setIsEditDialogOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
        <CardDescription className="text-sm truncate">{config.site_url}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm mb-4">
          <div className="mb-2">
            <strong>Méthode d'authentification:</strong>{" "}
            {config.app_username && config.app_password ? (
              <span className="text-green-600">Application Password</span>
            ) : config.rest_api_key ? (
              <span className="text-green-600">Clé API REST</span>
            ) : (
              <span className="text-amber-600">Non configurée</span>
            )}
          </div>
          <WordPressConnectionStatus configId={config.id} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        {!readOnly && (
          <>
            <Button variant="ghost" size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive" 
              onClick={() => onDelete && onDelete(config.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>

            {/* Dialog pour éditer la configuration si onEdit n'est pas fourni */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Modifier la configuration WordPress</DialogTitle>
                </DialogHeader>
                <WordPressConfigForm
                  config={config}
                  onSubmit={(data) => {
                    // Supposons que onUpdateConfig est disponible même si onEdit ne l'est pas
                    if (onUpdateConfig) {
                      onUpdateConfig(config.id, data);
                      setIsEditDialogOpen(false);
                    }
                  }}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdateConfig?: (id: string, data: Partial<WordPressConfig>) => void;
  isLoading: boolean;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const WordPressConfigList = ({ 
  configs, 
  onEdit, 
  onDelete,
  onUpdateConfig,
  isLoading,
  isSubmitting = false,
  readOnly = false
}: WordPressConfigListProps) => {
  if (isLoading) {
    return <p>Chargement des configurations WordPress...</p>;
  }

  if (!configs || configs.length === 0) {
    return <p>Aucune configuration WordPress disponible.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {configs.map((config) => (
        <WordPressConfigItem
          key={config.id}
          config={config}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateConfig={onUpdateConfig}
          isSubmitting={isSubmitting}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default WordPressConfigList;
