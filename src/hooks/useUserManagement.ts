
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile, Role } from "@/types/auth";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)');
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Fetch auth users to get last sign in time
      const { data: authData, error: authError } = await supabase.functions.invoke('get-user-logins', {});
      
      if (authError) {
        console.error('Error fetching auth data:', authError);
      }
      
      const authUsers = authError ? [] : (authData as any[] || []);
      
      // Map last login times to user profiles
      const processedUsers: UserProfile[] = profilesData.map(profile => {
        const authUser = authUsers.find(user => user.id === profile.id);
        
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
          lastLogin: authUser?.last_sign_in_at || null
        };
      });
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setIsLoading(false);
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
    } catch (error) {
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
          client_id: userData.role === 'editor' ? userData.clientId : null,
          wordpress_config_id: (userData.role === 'editor' || userData.role === 'client') ? userData.wordpressConfigId : null
        })
        .eq('id', userId);
      
      if (profileError) {
        throw profileError;
      }
      
      // Si l'email a changé, nous devons utiliser la fonction Edge pour mettre à jour l'email dans auth
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: { 
          userId, 
          email: userData.email,
          name: userData.name,
          role: userData.role,
          clientId: userData.clientId,
          wordpressConfigId: userData.wordpressConfigId
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      
      toast.success("Utilisateur mis à jour avec succès");
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
      
      // Appel de la fonction Edge pour supprimer l'utilisateur
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && (data as any).error) {
        throw new Error((data as any).error);
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
