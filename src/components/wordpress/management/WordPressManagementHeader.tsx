
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import { WordPressConfig } from "@/types/wordpress";
import { toast } from "sonner";

interface WordPressManagementHeaderProps {
  isAdmin: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  isSubmitting: boolean;
  createConfig: (data: Partial<WordPressConfig>) => Promise<void>;
}

const WordPressManagementHeader: React.FC<WordPressManagementHeaderProps> = ({
  isAdmin,
  isDialogOpen,
  setIsDialogOpen,
  isSubmitting,
  createConfig,
}) => {
  const handleCreateConfig = async (data: any) => {
    try {
      await createConfig(data);
      setIsDialogOpen(false);
      toast.success("Configuration WordPress créée avec succès");
    } catch (err: any) {
      console.error("Error creating config:", err);
      toast.error(err.message || "Erreur lors de la création de la configuration");
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle configuration WordPress</DialogTitle>
        </DialogHeader>
        <WordPressConfigForm
          onSubmit={handleCreateConfig}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WordPressManagementHeader;
