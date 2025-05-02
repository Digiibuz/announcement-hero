
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import { WordPressConfig } from "@/types/wordpress";
import { toast } from "sonner";

interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: WordPressConfig | null;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  isSubmitting: boolean;
}

const EditConfigDialog: React.FC<EditConfigDialogProps> = ({
  open,
  onOpenChange,
  config,
  onUpdateConfig,
  isSubmitting,
}) => {
  const handleUpdateConfig = async (data: Partial<WordPressConfig>) => {
    if (!config) return;
    
    try {
      await onUpdateConfig(config.id, data);
      onOpenChange(false);
      toast.success("Configuration WordPress mise à jour avec succès");
    } catch (err: any) {
      console.error("Error updating config:", err);
      toast.error(err.message || "Erreur lors de la mise à jour de la configuration");
    }
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Modifier la configuration WordPress
          </DialogTitle>
        </DialogHeader>
        <WordPressConfigForm
          defaultValues={config}
          onSubmit={handleUpdateConfig}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditConfigDialog;
