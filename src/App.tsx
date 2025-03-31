
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import CreateDiviPixelPage from "./pages/CreateDiviPixelPage";
import Announcements from "./pages/Announcements";
import DiviPixelPages from "./pages/DiviPixelPages";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import UserManagement from "./pages/UserManagement";
import WordPressManagement from "./pages/WordPressManagement";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin only route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
  // Debug log pour les routes
  useEffect(() => {
    console.log("Routes chargées");
  }, []);

  return (
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
      
      {/* Routes DiviPixel */}
      <Route 
        path="/divipixel-pages" 
        element={
          <ProtectedRoute>
            <DiviPixelPages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-divipixel" 
        element={
          <ProtectedRoute>
            <CreateDiviPixelPage />
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
  );
};

// L'ordre des providers est important pour que les hooks fonctionnent correctement
const App = () => {
  // Débug log pour l'initialisation de l'application
  useEffect(() => {
    console.log("Application initialisée");
  }, []);

  return (
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
};

export default App;
