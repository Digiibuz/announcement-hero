
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
import WordPressClientUsers from "@/components/wordpress/WordPressClientUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = React.useState("configs");

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="configs">Configurations</TabsTrigger>
                <TabsTrigger value="clients">Utilisateurs clients</TabsTrigger>
              </TabsList>
              
              <TabsContent value="configs" className="w-full">
                <WordPressConfigList
                  configs={configs}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                  onUpdateConfig={handleUpdateConfig}
                  onDeleteConfig={deleteConfig}
                />
              </TabsContent>
              
              <TabsContent value="clients" className="w-full">
                <WordPressClientUsers />
              </TabsContent>
            </Tabs>
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
