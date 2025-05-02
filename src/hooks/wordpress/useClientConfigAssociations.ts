
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientWordPressConfig } from "@/types/wordpress";
import { toast } from "sonner";

/**
 * Hook for managing client associations with WordPress configurations
 */
export const useClientConfigAssociations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const associateClientToConfig = async (clientId: string, configId: string) => {
    try {
      setIsSubmitting(true);
      
      // Check if association already exists
      const { data: existingAssoc, error: checkError } = await supabase
        .from('client_wordpress_configs')
        .select('id')
        .eq('client_id', clientId)
        .eq('wordpress_config_id', configId)
        .maybeSingle();
      
      if (checkError) {
        throw checkError;
      }
      
      // If association already exists, return it
      if (existingAssoc) {
        return existingAssoc;
      }
      
      // Create new association
      const { data, error } = await supabase
        .from('client_wordpress_configs')
        .insert([{ client_id: clientId, wordpress_config_id: configId }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      }

      toast.success("Client associé à la configuration WordPress avec succès");
      return data;
    } catch (error: any) {
      console.error('Error associating client to WordPress config:', error);
      toast.error(`Erreur lors de l'association: ${error.message}`);
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

      if (onSuccess) {
        onSuccess();
      }

      toast.success("Association client-WordPress supprimée avec succès");
    } catch (error: any) {
      console.error('Error removing client-WordPress association:', error);
      toast.error(`Erreur lors de la suppression de l'association: ${error.message}`);
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
