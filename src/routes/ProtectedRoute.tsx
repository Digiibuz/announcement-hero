
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { LoadingFallback } from "@/components/ui/loading-fallback";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isOnResetPasswordPage } = useAuth();
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Ne pas vérifier l'authentification si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      sessionStorage.setItem('lastAuthenticatedPath', location.pathname);
    }
    
    // Marquer la fin du chargement initial
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [location.pathname, isAuthenticated, isLoading, isOnResetPasswordPage, isInitialLoad]);

  // Affichage pendant le chargement adapté au réseau
  if (isLoading) {
    return <LoadingFallback message={isInitialLoad ? "Vérification de l'authentification..." : undefined} />;
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

  return <>{children}</>;
};
