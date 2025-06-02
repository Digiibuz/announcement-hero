
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
      
      // Fetch last login data from Edge function
      let loginData: any[] = [];
      try {
        const { data: loginResponse, error: loginError } = await supabase.functions.invoke('get-user-logins');
        if (!loginError && loginResponse) {
          loginData = loginResponse;
        }
      } catch (error) {
        console.warn("Could not fetch login data:", error);
        // Continue without login data
      }
      
      // Format user profiles with login data
      const processedUsers: UserProfile[] = profilesData.map(profile => {
        const userLoginInfo = loginData.find(login => login.id === profile.id);
        
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
          lastLogin: userLoginInfo?.last_sign_in_at || null
        };
      });
      
      setUsers(processedUsers);
      console.log("Utilisateurs chargés avec succès:", processedUsers.length);
    } catch (error: any) {
      console.error('Error fetching users:', error);
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
      
      // Appeler la fonction Edge delete-user pour supprimer l'utilisateur complètement
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        console.error("Error calling delete-user function:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error("La suppression de l'utilisateur a échoué");
      }
      
      // Mise à jour de la liste locale d'utilisateurs
      setUsers(users.filter(user => user.id !== userId));
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
