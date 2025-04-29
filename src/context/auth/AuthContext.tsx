
import React, { createContext, useContext } from "react";
import { AuthContextType } from "./types";
import { useAuthState } from "./useAuthState";
import { useImpersonation } from "./useImpersonation";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  isClient: false,
  isOnResetPasswordPage: false,
  originalUser: null,
  isImpersonating: false,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  impersonateUser: () => {},
  stopImpersonating: () => {}
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, 
    session, 
    isLoading, 
    isAuthenticated, 
    isAdmin, 
    isClient, 
    isOnResetPasswordPage,
    configError,
    isConfigLoading,
    login, 
    logout, 
    resetPassword, 
    updatePassword 
  } = useAuthState();
  
  const { 
    originalUser, 
    isImpersonating, 
    impersonateUser, 
    stopImpersonating 
  } = useImpersonation(user);

  // Render loading state
  if (isConfigLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingIndicator variant="dots" size={42} />
        <p className="mt-4 text-center text-muted-foreground">
          Initializing configuration...
        </p>
      </div>
    );
  }

  // Render error state
  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="rounded-lg border p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Configuration Error</h2>
          <p className="mb-4 text-muted-foreground">
            {configError.message || "Failed to load Supabase configuration."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Provider value
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    isClient,
    isOnResetPasswordPage,
    originalUser,
    isImpersonating,
    login,
    logout,
    resetPassword,
    updatePassword,
    impersonateUser,
    stopImpersonating
  };

  // Render provider with value
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
