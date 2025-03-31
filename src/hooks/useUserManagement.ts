
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile, Role } from "@/types/auth";
import { getSessionData, saveSessionData } from "@/utils/cacheStorage";

// ID unique pour la mise en cache des données utilisateurs
const USERS_CACHE_KEY = 'admin-users-list';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Essayer d'abord de récupérer les utilisateurs depuis le cache de session
      const cachedUsers = await getSessionData<UserProfile[]>(USERS_CACHE_KEY);
      if (cachedUsers && cachedUsers.length > 0) {
        console.log("Utilisation des données utilisateurs en cache:", cachedUsers.length);
        setUsers(cachedUsers);
        setIsLoading(false);
        
        // Continuer à charger en arrière-plan pour maintenir les données à jour
        setTimeout(() => fetchFromDatabase(false), 100);
        return;
      }
      
      // Si pas de cache, charger depuis la base de données
      await fetchFromDatabase(true);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs");
      setIsLoading(false);
    }
  }, []);
  
  // Fonction séparée pour charger depuis la base de données
  const fetchFromDatabase = async (updateLoadingState: boolean) => {
    try {
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)');
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Format user profiles without relying on the Edge function
      const processedUsers: UserProfile[] = profilesData.map(profile => {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as Role,
          clientId: profile.client_id,
          wordpressConfigId: profile.wordpress_config_id || null,
          wordpressConfig: profile.wordpress_configs ? {
            name: profile.wordpress_configs.name,
            site_url: profile.wordpress_configs.site_url
          } : null,
          lastLogin: null // Nous n'avons plus accès à cette information sans la fonction Edge
        };
      });
      
      // Sauvegarder dans le cache de session pour les autres onglets
      await saveSessionData(USERS_CACHE_KEY, processedUsers);
      
      setUsers(processedUsers);
      console.log("Utilisateurs chargés avec succès:", processedUsers.length);
    } catch (error: any) {
      console.error('Error fetching users from database:', error);
      if (updateLoadingState) {
        toast.error("Erreur lors de la récupération des utilisateurs");
      }
    } finally {
      if (updateLoadingState) {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Un email de réinitialisation a été envoyé");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserProfile>) => {
    try {
      setIsUpdating(true);
      
      // Mise à jour du profil dans la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          wordpress_config_id: userData.role === 'client' ? userData.wordpressConfigId : null
        })
        .eq('id', userId);
      
      if (profileError) {
        throw profileError;
      }
      
      // Mettre à jour le cache de session
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, ...userData } 
          : user
      );
      await saveSessionData(USERS_CACHE_KEY, updatedUsers);
      
      toast.success("Profil utilisateur mis à jour avec succès");
      await fetchUsers(); // Recharger la liste des utilisateurs
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      
      // Alternative à la fonction Edge: supprimer seulement le profil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Mise à jour de la liste locale d'utilisateurs
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      // Mettre à jour le cache de session
      await saveSessionData(USERS_CACHE_KEY, updatedUsers);
      
      toast.success("Utilisateur supprimé avec succès");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Chargement des utilisateurs au montage
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    isDeleting,
    isUpdating,
    fetchUsers,
    handleResetPassword,
    updateUser,
    deleteUser
  };
};
