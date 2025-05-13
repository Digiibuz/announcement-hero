
import React, { createContext, useContext } from "react";
import { UserProfile, AuthContextType } from "@/types/auth";
import { useAuthState } from "@/hooks/useAuth/useAuthState";
import { useAuthOperations } from "@/hooks/useAuth/useAuthOperations";
import { useAuthImpersonation } from "@/hooks/useAuth/useAuthImpersonation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use custom hooks for better organization
  const { 
    isLoading, 
    setIsLoading, 
    userProfile, 
    setUserProfile,
    isOnResetPasswordPage 
  } = useAuthState();
  
  const { login, logout } = useAuthOperations(setUserProfile);
  
  const { 
    originalUser, 
    isImpersonating, 
    impersonateUser,
    stopImpersonating
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
