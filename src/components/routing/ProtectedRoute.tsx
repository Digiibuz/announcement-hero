
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      sessionStorage.setItem('lastAuthenticatedPath', location.pathname);
    }
  }, [location.pathname, isAuthenticated, isLoading, isOnResetPasswordPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  // Autoriser l'accès à la page de réinitialisation de mot de passe si nous détectons que l'utilisateur est sur cette page
  if (isOnResetPasswordPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
