
import React, { createContext, useContext } from "react";
import { UserProfile } from "@/types/auth";
import { AuthContextType } from "./types";
import { useAuthState } from "./AuthState";
import { useAuthActions } from "./AuthActions";
import { useImpersonation } from "@/hooks/useImpersonation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    userProfile, 
    isLoading, 
    originalUser, 
    isImpersonating: isImp,
    isOnResetPasswordPage,
    setUserProfile,
    fetchFullProfile
  } = useAuthState();

  // Set up impersonation hooks separately to avoid circular dependencies
  const { impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);

  const { 
    login, 
    logout, 
    impersonateUser,
    stopImpersonating 
  } = useAuthActions(
    setUserProfile, 
    userProfile, 
    originalUser,
    startImpersonation,
    endImpersonation
  );

  const value: AuthContextType = {
    userProfile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating: isImp,
    isOnResetPasswordPage,
    error: null,
    setUserProfile,
    fetchFullProfile
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
