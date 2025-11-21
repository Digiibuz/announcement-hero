
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UserSearchBar from "@/components/users/UserSearchBar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import WordPressConfigList from "@/components/wordpress/WordPressConfigList";
import WordPressConnectionFilter from "@/components/wordpress/WordPressConnectionFilter";
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
  const isCommercial = user?.role === 'commercial';
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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [connectionFilter, setConnectionFilter] = React.useState("all");

  // Get connection status for a site (same logic as DisconnectedSitesTable)
  const getConnectionStatus = (config: WordPressConfig) => {
    if (config.app_username && config.app_password) {
      return "connected";
    } else if (config.rest_api_key) {
      return "partial";
    }
    return "disconnected";
  };

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

  // Le bouton d'ajout n'est disponible que pour les administrateurs, pas pour les clients ou commerciaux
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
  const pageTitle = (isClient || isCommercial) ? "Mon site" : "Gestion WordPress";

  // Filter configurations based on search term and connection status
  const filteredConfigs = configs.filter((config) => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.site_url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesConnection = connectionFilter === "all" || 
      getConnectionStatus(config) === connectionFilter;
    
    return matchesSearch && matchesConnection;
  });

  // Message to display when client/commercial has no site assigned
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
      {!(isAdmin || isClient || isCommercial) ? (
        <AccessDenied />
      ) : (
        <AnimatedContainer delay={200}>
          <div className="w-full space-y-4">
            {isAdmin && configs.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <UserSearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Rechercher par nom de site ou URL..."
                  />
                </div>
                <WordPressConnectionFilter
                  value={connectionFilter}
                  onChange={setConnectionFilter}
                />
              </div>
            )}
            
            {(isClient || isCommercial) && configs.length === 0 ? (
              <NoSiteMessage />
            ) : (
              <WordPressConfigList
                configs={filteredConfigs}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                onUpdateConfig={handleUpdateConfig}
                onDeleteConfig={deleteConfig}
                readOnly={isClient || isCommercial} // Mode lecture seule pour les clients et commerciaux
              />
            )}
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
