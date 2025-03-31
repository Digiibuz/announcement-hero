
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const WordPressManagement = () => {
  const { isAdmin, isClient, user } = useAuth();
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
  const [selectedConfigId, setSelectedConfigId] = React.useState<string | null>(null);

  const handleCreateConfig = async (data: any) => {
    await createConfig(data);
    setIsDialogOpen(false);
    fetchConfigs(); // Call fetchConfigs after creating a new config
  };

  // Fonction pour gérer l'édition d'une configuration
  const handleEdit = (id: string) => {
    setSelectedConfigId(id);
    // Vous pouvez ajouter d'autres logiques ici si nécessaire
  };

  // Wrapper pour updateConfig pour assurer la compatibilité avec le composant
  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    await updateConfig(id, data);
    // La fonction updateConfig retourne un WordPressConfig, mais nous ignorons la valeur retournée
    // pour rendre la fonction compatible avec le type attendu
  };

  // Fonction de rafraîchissement pour le bouton
  const handleRefresh = () => {
    fetchConfigs();
    toast.success("Configurations WordPress mises à jour");
  };

  // Le bouton d'ajout n'est disponible que pour les administrateurs, pas pour les clients
  const titleAction = isAdmin ? (
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

  // Change page title based on user role
  const pageTitle = isClient ? "Mon site" : "Gestion WordPress";

  // Message to display when client has no site assigned
  const NoSiteMessage = () => (
    <Card className="mt-4">
      <CardContent className="p-6 text-center">
        <p className="text-muted-foreground mb-2">
          Aucun site WordPress n'est actuellement attribué à votre compte.
        </p>
        <p className="text-sm text-muted-foreground">
          Veuillez contacter votre administrateur pour obtenir un accès.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout 
      title={pageTitle} 
      titleAction={titleAction}
      onRefresh={handleRefresh}
    >
      {!(isAdmin || isClient) ? (
        <AccessDenied />
      ) : (
        <AnimatedContainer delay={200}>
          <div className="w-full">
            {isClient && configs.length === 0 ? (
              <NoSiteMessage />
            ) : (
              <WordPressConfigList
                configs={configs}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                onEdit={handleEdit}
                onDelete={deleteConfig}
                onUpdateConfig={handleUpdateConfig}
                readOnly={isClient} // Mode lecture seule pour les clients
              />
            )}
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
