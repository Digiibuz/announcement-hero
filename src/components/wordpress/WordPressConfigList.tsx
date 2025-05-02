import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const WordPressConfigList: React.FC<WordPressConfigListProps> = ({
  configs,
  isLoading,
  isSubmitting,
  onUpdateConfig,
  onDeleteConfig,
  readOnly = false,
}) => {
  const [editConfigId, setEditConfigId] = React.useState<string | null>(null);

  const handleUpdateConfig = async (id: string, data: any) => {
    try {
      await onUpdateConfig(id, data);
      setEditConfigId(null);
      toast.success("Configuration WordPress mise à jour avec succès");
    } catch (err: any) {
      console.error("Error updating config:", err);
      toast.error(err.message || "Erreur lors de la mise à jour de la configuration");
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await onDeleteConfig(id);
      toast.success("Configuration WordPress supprimée avec succès");
    } catch (err: any) {
      console.error("Error deleting config:", err);
      toast.error(err.message || "Erreur lors de la suppression de la configuration");
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableCaption>
          Liste des configurations WordPress{" "}
          {isLoading ? "(Chargement...)" : `(${configs.length})`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>URL du site</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            {!readOnly && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.id}>
              <TableCell>{config.name}</TableCell>
              <TableCell>
                <a
                  href={config.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {config.site_url}
                </a>
              </TableCell>
              <TableCell className="text-center">
                <WordPressConnectionStatus configId={config.id} showDetails={true} />
              </TableCell>
              {!readOnly && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog open={editConfigId === config.id} onOpenChange={(open) => open ? setEditConfigId(config.id) : setEditConfigId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Modifier la configuration WordPress
                          </DialogTitle>
                        </DialogHeader>
                        <WordPressConfigForm
                          initialValues={config}
                          onSubmit={(data) => handleUpdateConfig(config.id, data)}
                          isSubmitting={isSubmitting}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WordPressConfigList;
