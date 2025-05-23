
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const AdminRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient, isOnResetPasswordPage } = useAuth();
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

  if (!isAdmin && !isClient && !isOnResetPasswordPage) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
