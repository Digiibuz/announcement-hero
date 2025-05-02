
import { useState } from "react";
import { deleteUserProfile } from "@/api/userApi";
import { toast } from "sonner";

export const useUserDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      
      await deleteUserProfile(userId);
      
      toast.success("Utilisateur supprimé avec succès");
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    deleteUser
  };
};
