
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
      
      // Better error handling with specific messages
      if (!window.navigator.onLine) {
        toast.error("Pas de connexion internet. Veuillez vérifier votre connexion réseau.");
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        toast.error("Problème de connexion au serveur. Veuillez réessayer plus tard.");
      } else {
        toast.error("Erreur lors de la réinitialisation du mot de passe");
      }
      
      return false;
    }
  };

  return {
    handleResetPassword
  };
};
