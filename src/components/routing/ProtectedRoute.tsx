
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

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
