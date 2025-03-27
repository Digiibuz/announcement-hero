
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Loader2, AlertTriangle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { WordPressConfig } from "@/types/wordpress";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = (configId: string) => {
    setConfigToDelete(configId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (configToDelete) {
      await onDeleteConfig(configToDelete);
      setConfirmOpen(false);
      setConfigToDelete(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>URL du site</TableHead>
            <TableHead>Clé API REST</TableHead>
            <TableHead>Identifiants</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Chargement des configurations...
                </div>
              </TableCell>
            </TableRow>
          ) : configs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Aucune configuration WordPress trouvée
              </TableCell>
            </TableRow>
          ) : (
            configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">{config.name}</TableCell>
                <TableCell>{config.site_url}</TableCell>
                <TableCell>{config.rest_api_key}</TableCell>
                <TableCell>
                  {config.username ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                      Configurés
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400">
                      Non configurés
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <WordPressConfigForm 
                      config={config}
                      onSubmit={(data) => onUpdateConfig(config.id, data)}
                      buttonText="Modifier"
                      dialogTitle={`Modifier la configuration : ${config.name}`}
                      dialogDescription="Mettez à jour les détails de cette configuration WordPress."
                      isSubmitting={isSubmitting}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      }
                    />
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(config.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Confirmation de suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette configuration WordPress ? Cette action est irréversible et pourrait affecter les clients associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WordPressConfigList;
