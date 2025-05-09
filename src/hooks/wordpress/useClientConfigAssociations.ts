
import { useState } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientWordPressConfig } from "@/types/wordpress";

/**
 * Hook for managing client-WordPress configuration associations
 */
export const useClientConfigAssociations = (onAssociationsChange?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const associateClientToConfig = async (clientId: string, configId: string) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('client_wordpress_configs')
        .insert([{ client_id: clientId, wordpress_config_id: configId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("Association client-WordPress créée avec succès");
      if (onAssociationsChange) onAssociationsChange();
      
      // Convert data to proper type
      return {
        id: typedData<string>(data.id),
        client_id: typedData<string>(data.client_id),
        wordpress_config_id: typedData<string>(data.wordpress_config_id),
        created_at: typedData<string>(data.created_at),
      } as ClientWordPressConfig;
    } catch (error) {
      console.error('Error associating client to WordPress config:', error);
      toast.error("Erreur lors de l'association du client à la configuration WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeClientConfigAssociation = async (id: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('client_wordpress_configs')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Association client-WordPress supprimée avec succès");
      if (onAssociationsChange) onAssociationsChange();
    } catch (error) {
      console.error('Error removing client WordPress config association:', error);
      toast.error("Erreur lors de la suppression de l'association client-WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    associateClientToConfig,
    removeClientConfigAssociation
  };
};
