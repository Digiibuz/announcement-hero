import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect } from 'react';

// Improve lazy loading with error boundaries and better chunk naming
const Index = lazy(() => import(/* webpackChunkName: "index" */ "./pages/Index"));
const Login = lazy(() => import(/* webpackChunkName: "login" */ "./pages/Login"));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ "./pages/Dashboard"));
const CreateAnnouncement = lazy(() => import(/* webpackChunkName: "create-announcement" */ "./pages/CreateAnnouncement"));
const Announcements = lazy(() => import(/* webpackChunkName: "announcements" */ "./pages/Announcements"));
const AnnouncementDetail = lazy(() => import(/* webpackChunkName: "announcement-detail" */ "./pages/AnnouncementDetail"));
const UserManagement = lazy(() => import(/* webpackChunkName: "user-management" */ "./pages/UserManagement"));
const WordPressManagement = lazy(() => import(/* webpackChunkName: "wordpress-management" */ "./pages/WordPressManagement"));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ "./pages/NotFound"));

// Better loading fallback with retry capability
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <div className="animate-pulse text-lg mb-4">Chargement...</div>
    <button 
      onClick={() => window.location.reload()}
      className="text-sm text-muted-foreground hover:text-primary underline mt-4"
    >
      Cliquer ici si le chargement prend trop de temps
    </button>
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
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Store current location in session storage to survive tab changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      sessionStorage.setItem('lastAuthenticatedPath', location.pathname);
    }
  }, [location.pathname, isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin only route component with improved state persistence
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient } = useAuth();
  const location = useLocation();

  // Enhanced admin route persistence
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (isAdmin || isClient) {
        console.log("Saving admin path:", location.pathname);
        sessionStorage.setItem('lastAdminPath', location.pathname);
      }
    }
  }, [location.pathname, isAuthenticated, isAdmin, isClient, isLoading]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autoriser l'accès aux utilisateurs admin et client
  if (!isAdmin && !isClient) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isClient, isLoading } = useAuth();
  const location = useLocation();
  
  // Enhanced path restoration with improved role checking and timing
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Current path:", location.pathname);
      console.log("Is admin:", isAdmin, "Is client:", isClient);
      
      // If we're at dashboard (potential redirect destination), check if we should go to admin page
      if (location.pathname === '/dashboard' || location.pathname === '/') {
        const lastAdminPath = sessionStorage.getItem('lastAdminPath');
        console.log("Last admin path from session:", lastAdminPath);
        
        if (lastAdminPath && (isAdmin || isClient)) {
          // Admin paths we should restore to
          const adminPaths = ['/users', '/wordpress'];
          
          if (adminPaths.includes(lastAdminPath)) {
            console.log("Redirecting to last admin path:", lastAdminPath);
            // Use a small timeout to ensure auth state is fully processed
            setTimeout(() => {
              window.history.replaceState(null, '', lastAdminPath);
              window.location.href = lastAdminPath;
            }, 100);
          }
        }
      }
    }
  }, [isAuthenticated, isAdmin, isClient, isLoading, location.pathname]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        
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
        
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

// L'ordre des providers est important pour que les hooks fonctionnent correctement
const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
