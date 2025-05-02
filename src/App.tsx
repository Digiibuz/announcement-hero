
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect } from 'react';
import { LoadingIndicator } from "./components/ui/loading-indicator";
import Login from "./pages/Login";

// Lazy loading other pages for performance
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateAnnouncement = lazy(() => import("./pages/CreateAnnouncement"));
const Announcements = lazy(() => import("./pages/Announcements"));
const AnnouncementDetail = lazy(() => import("./pages/AnnouncementDetail"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const WordPressManagement = lazy(() => import("./pages/WordPressManagement"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Support = lazy(() => import("./pages/Support"));
const GoogleBusinessPage = lazy(() => import("./pages/GoogleBusinessPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Composant de chargement amélioré avec animation
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingIndicator variant="dots" size={42} />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurer React Query pour éviter les requêtes inutiles
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected route component with improved memory
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  // Ne pas vérifier l'authentification si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      sessionStorage.setItem('lastAuthenticatedPath', location.pathname);
    }
  }, [location.pathname, isAuthenticated, isLoading, isOnResetPasswordPage]);

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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

// Admin only route component with improved state persistence
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Autoriser l'accès aux utilisateurs admin et client
  if (!isAdmin && !isClient && !isOnResetPasswordPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Composant de route publique qui redirige vers le tableau de bord si l'utilisateur est connecté
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Récupérer le chemin depuis lequel la redirection a été effectuée
  const from = location.state?.from?.pathname || '/dashboard';
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (isAuthenticated) {
    // Rediriger vers le dernier chemin visité ou le tableau de bord
    const lastPath = sessionStorage.getItem('lastAuthenticatedPath') || from;
    return <Navigate to={lastPath} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Redirect root to login if not authenticated */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                  } />
                  
                  {/* Public routes - accessibles sans authentification mais avec redirection si déjà connecté */}
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />
                  <Route path="/forgot-password" element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  } />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/announcements" 
                    element={
                      <ProtectedRoute>
                        <Announcements />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/announcements/:id" 
                    element={
                      <ProtectedRoute>
                        <AnnouncementDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create" 
                    element={
                      <ProtectedRoute>
                        <CreateAnnouncement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/support" 
                    element={
                      <ProtectedRoute>
                        <Support />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/google-business" 
                    element={
                      <ProtectedRoute>
                        <GoogleBusinessPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin/Client only routes */}
                  <Route 
                    path="/users" 
                    element={
                      <AdminRoute>
                        <UserManagement />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/wordpress" 
                    element={
                      <AdminRoute>
                        <WordPressManagement />
                      </AdminRoute>
                    } 
                  />
                  
                  {/* Fallback pour les routes inexistantes - rediriger vers login si non connecté */}
                  <Route path="*" element={
                    <ProtectedRoute>
                      <NotFound />
                    </ProtectedRoute>
                  } />
                </Routes>
                <SonnerToaster />
                <UIToaster />
              </Suspense>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
