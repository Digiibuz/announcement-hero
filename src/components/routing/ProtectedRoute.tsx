
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - State:', {
    isAuthenticated,
    isLoading,
    pathname: location.pathname
  });

  if (isLoading) {
    console.log('ProtectedRoute - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-digibuz-light">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  // Permettre l'accès à la page de reset password avec un token de récupération, même si connecté
  if (location.pathname === '/reset-password') {
    const hasRecoveryToken = window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token');
    if (hasRecoveryToken) {
      console.log('ProtectedRoute - Allowing reset password with recovery token');
      return <>{children}</>;
    }
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
