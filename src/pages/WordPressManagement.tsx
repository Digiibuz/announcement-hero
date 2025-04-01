
import React, { useState } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  const handleCreateConfig = async (data: any) => {
    await createConfig(data);
    setIsDialogOpen(false);
    fetchConfigs(); // Call fetchConfigs after creating a new config
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

  // Fonction pour rediriger vers Tom-E avec l'ID de config sélectionné
  const handleTomeManagement = () => {
    if (selectedConfigId) {
      navigate(`/tome?configId=${selectedConfigId}`);
    } else if (configs.length > 0) {
      navigate(`/tome?configId=${configs[0].id}`);
    } else {
      toast.error("Veuillez d'abord créer une configuration WordPress");
    }
  };

  // Utilisez useEffect pour définir selectedConfigId par défaut
  React.useEffect(() => {
    if (!selectedConfigId && configs.length > 0) {
      // Pour les clients, on sélectionne automatiquement leur configuration WordPress
      if (isClient && user?.wordpressConfigId) {
        setSelectedConfigId(user.wordpressConfigId);
      } else {
        setSelectedConfigId(configs[0].id);
      }
    }
  }, [configs, isClient, user, selectedConfigId]);

  // Le bouton d'ajout n'est disponible que pour les administrateurs, pas pour les clients
  const titleAction = isAdmin ? (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleTomeManagement}>
        <Settings className="h-4 w-4 mr-2" />
        Gestion Tom-E
      </Button>
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
    </div>
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
            {isAdmin && !isClient && configs.length > 0 && (
              <div className="mb-6">
                <select 
                  className="w-full md:w-64 p-2 border rounded-md"
                  value={selectedConfigId || ""}
                  onChange={e => setSelectedConfigId(e.target.value)}
                >
                  {configs.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
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
