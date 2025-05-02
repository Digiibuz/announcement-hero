
import { useAuthStateCore } from './hooks/useAuthStateCore';
import { useSessionHandler } from './hooks/useSessionHandler';
import { useAuthOperations } from './hooks/useAuthOperations';

export const useAuthState = () => {
  const {
    user,
    setUser,
    session,
    setSession,
    isLoading,
    setIsLoading,
    navigate,
    isOnResetPasswordPage,
    setIsOnResetPasswordPage,
    supabase,
    isConfigLoading,
    configError,
    isAdmin,
    isClient,
    isAuthenticated,
    silenceAllErrors
  } = useAuthStateCore();

  // Set up auth session handling
  useSessionHandler(
    supabase,
    setUser,
    setSession,
    setIsLoading,
    navigate,
    setIsOnResetPasswordPage,
    silenceAllErrors
  );

  // Set up auth operations
  const {
    login,
    logout,
    resetPassword,
    updatePassword
  } = useAuthOperations(supabase, setUser, setSession);

  return {
    user,
    session,
    isLoading: isLoading || isConfigLoading,
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
  };
};
