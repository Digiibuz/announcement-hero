
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setUsers(data as UserProfile[]);
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
          client_id: userData.role === 'editor' ? userData.clientId : null
        })
        .eq('id', userId);
      
      if (profileError) {
        throw profileError;
      }
      
      // Si l'email a changé, nous devons utiliser la fonction Edge pour mettre à jour l'email dans auth
      if (userData.email) {
        const { data, error } = await supabase.functions.invoke('update-user', {
          body: { 
            userId, 
            email: userData.email,
            name: userData.name,
            role: userData.role,
            clientId: userData.clientId
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data && (data as any).error) {
          throw new Error((data as any).error);
        }
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
