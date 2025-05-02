
import { UserProfile } from "@/types/auth";
import { useImpersonation } from "@/hooks/useImpersonation";

export const useAuthImpersonation = (
  userProfile: UserProfile | null, 
  setUserProfile: (profile: UserProfile | null) => void
) => {
  const { 
    originalUser, 
    isImpersonating, 
    impersonateUser: startImpersonation, 
    stopImpersonating: endImpersonation 
  } = useImpersonation(userProfile);

  // Impersonation wrapper
  const impersonateUser = (userToImpersonate: UserProfile) => {
    try {
      const impersonatedUser = startImpersonation(userToImpersonate);
      if (impersonatedUser) {
        setUserProfile(impersonatedUser);
        localStorage.setItem('userRole', impersonatedUser.role);
        localStorage.setItem('userId', impersonatedUser.id);
      }
      return impersonatedUser;
    } catch (error) {
      return null;
    }
  };

  // Stop impersonation wrapper
  const stopImpersonating = () => {
    try {
      const originalUserProfile = endImpersonation();
      if (originalUserProfile) {
        setUserProfile(originalUserProfile);
        localStorage.setItem('userRole', originalUserProfile.role);
        localStorage.setItem('userId', originalUserProfile.id);
      }
      return originalUserProfile;
    } catch (error) {
      return null;
    }
  };

  return {
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating
  };
};
