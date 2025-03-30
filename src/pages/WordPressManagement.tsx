
import React, { useEffect, useCallback } from "react";
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
  const { isAdmin, isClient, user, session } = useAuth();
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

  // Function to handle data loading
  const loadData = useCallback(() => {
    if (session && user) {
      console.log("WordPressManagement: Loading data with session and user", { 
        sessionId: session.access_token ? session.access_token.substring(0, 8) + '...' : 'none',
        userId: user.id
      });
      return fetchConfigs();
    } else {
      console.log("WordPressManagement: Cannot load data, missing session or user");
      return Promise.resolve();
    }
  }, [session, user, fetchConfigs]);

  // Load data when component mounts and when session/user changes
  useEffect(() => {
    console.log("WordPressManagement: Session/user changed, checking credentials", { 
      sessionExists: !!session, 
      userExists: !!user,
      isAdmin: isAdmin,
      isClient: isClient
    });
    
    loadData();
  }, [loadData, session, user, isAdmin, isClient]);

  // Add visibility change event listener for reloading data when coming back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("WordPressManagement: Tab became visible again, refreshing data");
        loadData();
      }
    };

    // Also reload on window focus
    const handleFocus = () => {
      console.log("WordPressManagement: Window focused, refreshing data");
      loadData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  const handleCreateConfig = async (data: any) => {
    try {
      console.log("Creating new WordPress config:", data);
      await createConfig(data);
      setIsDialogOpen(false);
      await loadData(); // Explicitly reload data after creation
    } catch (error) {
      console.error("Error in handleCreateConfig:", error);
      throw error; // Let the form component handle the error
    }
  };

  // Wrapper for updateConfig to ensure compatibility with the component
  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    try {
      console.log("Updating WordPress config:", id, data);
      await updateConfig(id, data);
      await loadData(); // Explicitly reload data after update
    } catch (error) {
      console.error("Error in handleUpdateConfig:", error);
      throw error; // Let the form component handle the error
    }
  };

  // The add button is only available for administrators, not for clients
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

  return (
    <PageLayout title={pageTitle} titleAction={titleAction}>
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
              onDeleteConfig={deleteConfig}
              readOnly={isClient}
            />
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
