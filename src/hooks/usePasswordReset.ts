
import { resetUserPassword } from "@/api/userApi";
import { toast } from "sonner";

export const usePasswordReset = () => {
  const handleResetPassword = async (email: string) => {
    try {
      await resetUserPassword(email);
      toast.success("Un email de réinitialisation a été envoyé");
      return true;
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
      return false;
    }
  };

  return {
    handleResetPassword
  };
};
