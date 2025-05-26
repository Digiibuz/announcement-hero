
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const AdminRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  console.log('AdminRoute - State:', {
    isAuthenticated,
    isLoading,
    isAdmin,
    isClient,
    adminOnly,
    isOnResetPasswordPage,
    pathname: location.pathname
  });

  if (isLoading) {
    console.log('AdminRoute - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-digibuz-light">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  if (!isAuthenticated && !isOnResetPasswordPage) {
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    if (location.pathname === '/reset-password' && hasRecoveryToken) {
      console.log('AdminRoute - Allowing reset password with recovery token');
      return <>{children}</>;
    }
    console.log('AdminRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isClient && !isOnResetPasswordPage) {
    console.log('AdminRoute - User not admin or client, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('AdminRoute - Admin only route but user is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AdminRoute - Rendering admin content');
  return <>{children}</>;
};

export default AdminRoute;
