
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import WordPressConfigList from "@/components/wordpress/WordPressConfigList";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/users/AccessDenied";
import { WordPressConfig } from "@/types/wordpress";

const WordPressManagement = () => {
  const { isAdmin, isClient } = useAuth();
  const {
    configs,
    isLoading,
    isSubmitting,
    createConfig,
    updateConfig,
    deleteConfig,
    fetchConfigs,
  } = useWordPressConfigs();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Fetch configs when component mounts
  React.useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleCreateConfig = async (data: any) => {
    await createConfig(data);
    setIsDialogOpen(false);
    fetchConfigs(); // Refresh configs after creating a new one
  };

  // Handler for updating config
  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    await updateConfig(id, data);
    fetchConfigs(); // Refresh configs after updating
  };

  // Handler for deleting config
  const handleDeleteConfig = async (id: string) => {
    await deleteConfig(id);
    fetchConfigs(); // Refresh configs after deleting
  };

  const titleAction = (isAdmin || isClient) ? (
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
  ) : null;

  return (
    <PageLayout title="Gestion WordPress" titleAction={titleAction}>
      {!(isAdmin || isClient) ? (
        <AccessDenied />
      ) : (
        <AnimatedContainer delay={200}>
          <div className="w-full">
            <WordPressConfigList
              configs={configs}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              onUpdateConfig={handleUpdateConfig}
              onDeleteConfig={handleDeleteConfig}
            />
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
