
import React, { useState } from "react";
import { Trash, Edit, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigForm from "./WordPressConfigForm";
import WordPressConnectionStatus from "./WordPressConnectionStatus";
import { useAuth } from "@/context/AuthContext";

interface WordPressConfigItemProps {
  config: WordPressConfig;
  onUpdate: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSubmitting: boolean;
  readOnly?: boolean;
}

const WordPressConfigItem: React.FC<WordPressConfigItemProps> = ({
  config,
  onUpdate,
  onDelete,
  isSubmitting,
  readOnly = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  
  const isUserConfig = user?.wordpressConfigId === config.id;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(config.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={isUserConfig ? "border-primary/40" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{config.name}</CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {config.site_url}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isUserConfig && (
              <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                Active
              </Badge>
            )}
            <WordPressConnectionStatus configId={config.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-muted-foreground text-xs">Authentification:</p>
            <p className="font-medium truncate">
              {config.app_username && config.app_password 
                ? "Application Password" 
                : config.rest_api_key 
                  ? "REST API Key" 
                  : "Aucune"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Dernière mise à jour:</p>
            <p className="font-medium truncate">
              {new Date(config.updated_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-end gap-2 w-full">
          {!readOnly && (
            <>
              <WordPressConfigForm
                config={config}
                onSubmit={(data) => onUpdate(config.id, data)}
                buttonText="Modifier"
                dialogTitle="Modifier la configuration WordPress"
                dialogDescription="Modifiez les détails de cette configuration WordPress."
                isSubmitting={isSubmitting}
                buttonSize="sm"
                trigger={<Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Modifier</Button>}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="mr-2 h-4 w-4" />
                    )}
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cela supprimera définitivement cette configuration WordPress.
                      {isUserConfig && (
                        <p className="mt-2 text-destructive font-medium">
                          Attention: Cette configuration est actuellement utilisée par votre compte !
                        </p>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default WordPressConfigItem;
