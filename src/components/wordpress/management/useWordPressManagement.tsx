
import { useState, useEffect } from "react";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useAuth } from "@/context/AuthContext";
import { WordPressConfig } from "@/types/wordpress";
import { toast } from "sonner";

export const useWordPressManagement = () => {
  const { isAdmin, isClient, userProfile } = useAuth();
  const {
    configs,
    isLoading,
    isSubmitting,
    error: configError,
    createConfig,
    updateConfig,
    deleteConfig,
    fetchConfigs,
  } = useWordPressConfigs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Effect to ensure data is loaded when component mounts
  useEffect(() => {
    console.log("WordPressManagement - Component mounted");
    // Only if authentication status is determined
    if (isAdmin !== undefined || isClient !== undefined) {
      console.log("WordPressManagement - Fetching configs");
      try {
        fetchConfigs();
        setError(null);
      } catch (err: any) {
        console.error("Error fetching configs:", err);
        setError(err.message || "Erreur lors du chargement des configurations WordPress");
      }
    }
  }, [fetchConfigs, isAdmin, isClient]);
  
  // Update error when configError changes
  useEffect(() => {
    if (configError) {
      setError(configError);
    }
  }, [configError]);

  // Debug info
  useEffect(() => {
    console.log("WordPressManagement - Current user:", userProfile);
    console.log("WordPressManagement - isClient:", isClient);
    console.log("WordPressManagement - isAdmin:", isAdmin);
    console.log("WordPressManagement - configs:", configs);
  }, [userProfile, isClient, isAdmin, configs]);

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

  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    try {
      await updateConfig(id, data);
      toast.success("Configuration WordPress mise à jour avec succès");
    } catch (err: any) {
      console.error("Error updating config:", err);
      toast.error(err.message || "Erreur lors de la mise à jour de la configuration");
    }
  };

  const handleRefresh = () => {
    try {
      setIsFetching(true);
      fetchConfigs();
      setError(null);
      toast.success("Configurations WordPress mises à jour");
    } catch (err: any) {
      console.error("Error refreshing configs:", err);
      setError(err.message || "Erreur lors du rafraîchissement des configurations");
      toast.error("Erreur lors du rafraîchissement des configurations");
    } finally {
      setIsFetching(false);
    }
  };

  return {
    isAdmin,
    isClient,
    userProfile,
    configs,
    isLoading,
    isSubmitting,
    error,
    isFetching,
    isDialogOpen,
    setIsDialogOpen,
    handleCreateConfig,
    handleUpdateConfig,
    deleteConfig,
    handleRefresh
  };
};
