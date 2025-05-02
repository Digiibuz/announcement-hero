
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const WordPressManagement = () => {
  const { isAdmin, isClient, userProfile } = useAuth();
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
  const [error, setError] = React.useState<string | null>(null);

  // Effet pour s'assurer que les données sont chargées dès le montage du composant
  React.useEffect(() => {
    console.log("WordPressManagement - Fetching configs");
    try {
      fetchConfigs();
      setError(null);
    } catch (err: any) {
      console.error("Error fetching configs:", err);
      setError(err.message || "Erreur lors du chargement des configurations WordPress");
    }
  }, [fetchConfigs]);

  const handleCreateConfig = async (data: any) => {
    try {
      await createConfig(data);
      setIsDialogOpen(false);
      fetchConfigs(); // Call fetchConfigs after creating a new config
      toast.success("Configuration WordPress créée avec succès");
    } catch (err: any) {
      console.error("Error creating config:", err);
      toast.error(err.message || "Erreur lors de la création de la configuration");
    }
  };

  // Wrapper pour updateConfig pour assurer la compatibilité avec le composant
  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    try {
      await updateConfig(id, data);
      toast.success("Configuration WordPress mise à jour avec succès");
    } catch (err: any) {
      console.error("Error updating config:", err);
      toast.error(err.message || "Erreur lors de la mise à jour de la configuration");
    }
  };

  // Fonction de rafraîchissement pour le bouton
  const handleRefresh = () => {
    try {
      fetchConfigs();
      setError(null);
      toast.success("Configurations WordPress mises à jour");
    } catch (err: any) {
      console.error("Error refreshing configs:", err);
      setError(err.message || "Erreur lors du rafraîchissement des configurations");
      toast.error("Erreur lors du rafraîchissement des configurations");
    }
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

  // Debug info
  React.useEffect(() => {
    console.log("WordPressManagement - Current user:", userProfile);
    console.log("WordPressManagement - isClient:", isClient);
    console.log("WordPressManagement - isAdmin:", isAdmin);
    console.log("WordPressManagement - configs:", configs);
  }, [userProfile, isClient, isAdmin, configs]);

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
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isClient && configs.length === 0 ? (
              <NoSiteMessage />
            ) : (
              <WordPressConfigList
                configs={configs}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                onUpdateConfig={handleUpdateConfig}
                onDeleteConfig={deleteConfig}
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
