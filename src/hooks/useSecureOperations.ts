
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/integrations/supabase/client';

/**
 * Hook pour effectuer des opérations sécurisées via les Edge Functions
 * Ces opérations nécessitent des autorisations d'admin et sont exécutées en toute sécurité côté serveur
 */
export const useSecureOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin } = useAuth();
  
  /**
   * Appelle une fonction Edge sécurisée avec les bonnes autorisations
   */
  const callSecureOperation = async <T = any>(operation: string, data?: any): Promise<T | null> => {
    if (!isAdmin) {
      toast.error("Accès non autorisé. Seuls les administrateurs peuvent effectuer cette opération.");
      return null;
    }
    
    setIsLoading(true);
    try {
      // Obtenir une instance initialisée du client Supabase
      const supabase = await getSupabaseClient();
      
      const { data: result, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: { operation, data },
      });
      
      if (error) {
        throw error;
      }
      
      return result as T;
    } catch (error: any) {
      console.error(`Erreur lors de l'appel à l'opération sécurisée ${operation}:`, error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Récupère la liste complète des utilisateurs avec leurs rôles (opération d'admin)
   */
  const getAllUsersWithRoles = async () => {
    return callSecureOperation('getUsersWithRoles');
  };
  
  return {
    isLoading,
    callSecureOperation,
    getAllUsersWithRoles,
  };
};
