
import React, { useState } from "react";
import AuthContext from "./AuthContext";
import { useAuthSession } from "./useAuthSession";
import { useAuthFunctions } from "./useAuthFunctions";
import { useAuthImpersonation } from "./useAuthImpersonation";
import { AuthContextType } from "@/types/auth";
import { useUserProfile } from "@/hooks/useUserProfile";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile } = useUserProfile();
  
  const { isOnResetPasswordPage } = useAuthSession();
  const { login, logout } = useAuthFunctions(userProfile, setUserProfile, setIsLoading);
  const { 
    impersonateUser, 
    stopImpersonating, 
    originalUser, 
    isImpersonating 
  } = useAuthImpersonation(userProfile, setUserProfile);

  const value: AuthContextType = {
    user: userProfile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
    isOnResetPasswordPage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
