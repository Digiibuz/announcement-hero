
import { useState, useCallback } from "react";
import { useWordPressConfigsList } from "./wordpress/useWordPressConfigsList";
import { useWordPressConfigCrud } from "./wordpress/useWordPressConfigCrud";
import { useClientConfigAssociations } from "./wordpress/useClientConfigAssociations";
import { WordPressConfig } from "@/types/wordpress";

/**
 * Main hook for WordPress configuration management
 * Combines functionalities from specialized hooks
 */
export const useWordPressConfigs = () => {
  // Manage the refresh state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Trigger refresh for all data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Get the list data with refresh capability
  const { 
    configs, 
    clientConfigs, 
    isLoading, 
    fetchConfigs, 
    fetchClientConfigs, 
    getConfigsForClient 
  } = useWordPressConfigsList();

  // Setup CRUD operations with refresh callback
  const { 
    isSubmitting: isCrudSubmitting, 
    createConfig: createConfigBase, 
    updateConfig: updateConfigBase, 
    deleteConfig: deleteConfigBase 
  } = useWordPressConfigCrud(refreshData);

  // Setup client associations with refresh callback
  const {
    isSubmitting: isAssociationSubmitting,
    associateClientToConfig: associateClientToConfigBase,
    removeClientConfigAssociation: removeClientConfigAssociationBase
  } = useClientConfigAssociations(refreshData);

  // Combined submit state
  const isSubmitting = isCrudSubmitting || isAssociationSubmitting;

  // Wrapped functions to ensure data refreshes
  const createConfig = async (config: Omit<WordPressConfig, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createConfigBase(config);
    await fetchConfigs();
    return result;
  };

  const updateConfig = async (id: string, config: Partial<WordPressConfig>) => {
    const result = await updateConfigBase(id, config);
    await fetchConfigs();
    return result;
  };

  const deleteConfig = async (id: string) => {
    await deleteConfigBase(id);
    await fetchConfigs();
  };

  const associateClientToConfig = async (clientId: string, configId: string) => {
    const result = await associateClientToConfigBase(clientId, configId);
    await fetchClientConfigs();
    return result;
  };

  const removeClientConfigAssociation = async (id: string) => {
    await removeClientConfigAssociationBase(id);
    await fetchClientConfigs();
  };

  return {
    configs,
    clientConfigs,
    isLoading,
    isSubmitting,
    fetchConfigs,
    fetchClientConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    associateClientToConfig,
    removeClientConfigAssociation,
    getConfigsForClient
  };
};
