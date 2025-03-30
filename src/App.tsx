
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import UserManagement from "./pages/UserManagement";
import WordPressManagement from "./pages/WordPressManagement";
import NotFound from "./pages/NotFound";
import { Suspense, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, session } = useAuth();

  // Debugging logs
  useEffect(() => {
    console.log("ProtectedRoute state:", { isAuthenticated, isLoading, sessionExists: !!session });
  }, [isAuthenticated, isLoading, session]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated || !session) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin only route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient, session } = useAuth();

  // Debugging logs
  useEffect(() => {
    console.log("AdminRoute state check:", { 
      isAuthenticated, 
      isLoading, 
      isAdmin, 
      isClient, 
      sessionExists: !!session 
    });
  }, [isAuthenticated, isLoading, isAdmin, isClient, session]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated || !session) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Authorize access to admin and client users
  if (!isAdmin && !isClient) {
    console.log("Not authorized, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// AppRoutes component uses useAuth, so it needs to be inside AuthProvider
const AppRoutes = () => {
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

// Ensure proper component wrapping order
const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
