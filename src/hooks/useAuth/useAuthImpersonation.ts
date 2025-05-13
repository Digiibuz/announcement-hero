
import { UserProfile } from "@/types/auth";
import { useImpersonation } from "@/hooks/useImpersonation";

export const useAuthImpersonation = (
  userProfile: UserProfile | null,
  setUserProfile: (profile: UserProfile | null) => void
) => {
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = 
    useImpersonation(userProfile);

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
    }
  };

  const stopImpersonating = () => {
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
    }
  };

  return {
    originalUser,
    isImpersonating,
    impersonateUser,
    stopImpersonating
  };
};
