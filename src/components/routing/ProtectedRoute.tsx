
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  if (!isAuthenticated && !isOnResetPasswordPage) {
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    if (location.pathname === '/reset-password' && hasRecoveryToken) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
