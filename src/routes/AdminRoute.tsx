
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/auth";
import { LoadingFallback } from "@/components/ui/loading-fallback";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, isAdmin, isClient, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  // Enhanced admin route persistence
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      if (isAdmin || isClient) {
        console.log("Saving admin path:", location.pathname);
        sessionStorage.setItem('lastAdminPath', location.pathname);
      }
    }
  }, [location.pathname, isAuthenticated, isAdmin, isClient, isLoading, isOnResetPasswordPage]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Si on est sur la page de réinitialisation, on laisse passer même si non authentifié
  if (!isAuthenticated && !isOnResetPasswordPage) {
    // Vérifier si hash contient un token de récupération
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    if (location.pathname === '/reset-password' && hasRecoveryToken) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  // Autoriser l'accès aux utilisateurs admin et client
  if (!isAdmin && !isClient && !isOnResetPasswordPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
