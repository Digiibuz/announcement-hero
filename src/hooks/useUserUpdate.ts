
import { useState } from "react";
import { updateUserProfile } from "@/api/userApi";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useUserUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUser = async (userId: string, userData: Partial<UserProfile>) => {
    try {
      setIsUpdating(true);
      
      await updateUserProfile(userId, userData);
      
      toast.success("Profil utilisateur mis à jour avec succès");
      return true;
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    updateUser
  };
};
