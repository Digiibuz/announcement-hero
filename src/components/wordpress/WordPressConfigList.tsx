
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WordPressConfig } from "@/types/wordpress";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import WordPressConfigForm from "./WordPressConfigForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import WordPressConnectionStatus from "./WordPressConnectionStatus";

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
}

const WordPressConfigList: React.FC<WordPressConfigListProps> = ({
  configs,
  isLoading,
  isSubmitting,
  onUpdateConfig,
  onDeleteConfig
}) => {
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;
    
    try {
      setIsDeleting(true);
      await onDeleteConfig(configToDelete);
    } catch (error) {
      console.error("Error deleting WordPress config:", error);
    } finally {
      setIsDeleting(false);
      setConfigToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-muted/20 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Aucune configuration WordPress</h3>
        <p className="text-muted-foreground mb-4">
          Commencez par ajouter une nouvelle configuration WordPress.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {configs.map((config) => (
        <Card key={config.id} className="overflow-hidden">
          <CardHeader className="bg-muted/20 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{config.name}</CardTitle>
                <CardDescription className="mt-1">
                  <a 
                    href={config.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {config.site_url}
                  </a>
                </CardDescription>
              </div>
              <WordPressConnectionStatus 
                configId={config.id}
              />
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Identifiants API</h4>
                <div className="text-sm text-muted-foreground">
                  {config.rest_api_key ? (
                    <Badge variant="outline" className="font-mono">
                      {config.rest_api_key.substring(0, 8)}...
                    </Badge>
                  ) : (
                    <span>Non défini</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Identifiants</h4>
                <div className="text-sm text-muted-foreground">
                  {config.username ? (
                    <span>{config.username}</span>
                  ) : (
                    <span>Non défini</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-muted/10 pt-4 flex justify-end gap-2">
            <WordPressConfigForm
              config={config}
              onSubmit={(data) => onUpdateConfig(config.id, data)}
              buttonText="Modifier"
              dialogTitle="Modifier la configuration WordPress"
              dialogDescription="Mettez à jour les informations de configuration."
              isSubmitting={isSubmitting}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              }
            />
            
            <AlertDialog open={configToDelete === config.id} onOpenChange={(open) => !open && setConfigToDelete(null)}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setConfigToDelete(config.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cette configuration sera définitivement supprimée
                    de nos serveurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Continuer"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default WordPressConfigList;
