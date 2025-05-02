
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile, Role } from "@/types/auth";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
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
          } : undefined,
          lastLogin: null // Nous n'avons plus accès à cette information sans la fonction Edge
        };
      });
      
      setUsers(processedUsers);
    } catch (error: any) {
      // Silence les erreurs pour éviter l'affichage dans la console
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      // Silence les erreurs pour éviter l'affichage dans la console
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
      
      toast.success("Profil utilisateur mis à jour avec succès");
      await fetchUsers(); // Recharger la liste des utilisateurs
    } catch (error: any) {
      // Silence les erreurs pour éviter l'affichage dans la console
      toast.error(`Erreur lors de la mise à jour`);
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
      setUsers(users.filter(user => user.id !== userId));
      toast.success("Utilisateur supprimé avec succès");
    } catch (error: any) {
      // Silence les erreurs pour éviter l'affichage dans la console
      toast.error(`Erreur lors de la suppression`);
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
