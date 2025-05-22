
import { useState } from "react";
import { useAuthState } from "./useAuthState";
import { useAuthActions } from "./useAuthActions";
import { AuthContextType } from "./types";

export function useAuthProvider(): AuthContextType {
  const { 
    user, 
    isLoading: stateIsLoading, 
    isAuthenticated, 
    isAdmin, 
    isClient,
    originalUser,
    isImpersonating,
    isOnResetPasswordPage,
    setUserProfile 
  } = useAuthState();
  
  const [isLoading, setIsLoading] = useState(stateIsLoading);
  
  const { login, logout, impersonateUser, stopImpersonating } = useAuthActions({
    userProfile: user,
    setUserProfile,
    setIsLoading
  });

  return {
    user,
    isLoading: isLoading || stateIsLoading,
    isAuthenticated,
    isAdmin,
    isClient,
    login,
    logout,
    originalUser,
    isImpersonating,
    impersonateUser,
    stopImpersonating,
    isOnResetPasswordPage
  };
}
