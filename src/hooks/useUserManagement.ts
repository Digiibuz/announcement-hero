
import { useState, useCallback, useEffect } from "react";
import { UserProfile } from "@/types/auth";
import { fetchAllUsers } from "@/api/userApi";
import { useUserDelete } from "./useUserDelete";
import { useUserUpdate } from "./useUserUpdate";
import { usePasswordReset } from "./usePasswordReset";
import { toast } from "sonner";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isDeleting, deleteUser } = useUserDelete();
  const { isUpdating, updateUser } = useUserUpdate();
  const { handleResetPassword } = usePasswordReset();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const processedUsers = await fetchAllUsers();
      setUsers(processedUsers);
      console.log("Utilisateurs chargés avec succès:", processedUsers.length);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Wrapper for deleteUser that also updates the local state
  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      setUsers(users.filter(user => user.id !== userId));
    }
    return success;
  };

  // Wrapper for updateUser that refreshes the user list
  const handleUpdateUser = async (userId: string, userData: Partial<UserProfile>) => {
    const success = await updateUser(userId, userData);
    if (success) {
      await fetchUsers();
    }
    return success;
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
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser
  };
};
