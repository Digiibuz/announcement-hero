
import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Lazy loaded components
const Announcements = lazy(() => import('@/pages/Announcements'));
const CreateAnnouncement = lazy(() => import('@/pages/CreateAnnouncement'));
const AnnouncementDetail = lazy(() => import('@/pages/AnnouncementDetail'));
const WordPressManagement = lazy(() => import('@/pages/WordPressManagement'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const GoogleBusinessPage = lazy(() => import('@/pages/GoogleBusinessPage'));
const WebsiteManagement = lazy(() => import('@/pages/WebsiteManagement'));

// Composant de fallback amélioré avec debug
const LazyLoadFallback = ({ componentName }: { componentName?: string }) => {
  console.log(`Loading component: ${componentName || 'Unknown'}`);
  return (
    <div className="min-h-screen flex items-center justify-center bg-digibuz-light">
      <div className="text-center">
        <LoadingIndicator variant="dots" size={42} />
        <p className="mt-4 text-muted-foreground">
          Chargement{componentName ? ` de ${componentName}` : ''}...
        </p>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, isOnResetPasswordPage } = useAuth();

  return (
    <Suspense fallback={<LazyLoadFallback />}>
      <RouterRoutes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/forgot-password" 
          element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} 
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } 
        />
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
              <Suspense fallback={<LazyLoadFallback componentName="Annonces" />}>
                <Announcements />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/announcements/:id" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyLoadFallback componentName="Détail de l'annonce" />}>
                <AnnouncementDetail />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyLoadFallback componentName="Création d'annonce" />}>
                <CreateAnnouncement />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyLoadFallback componentName="Profil" />}>
                <UserProfile />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/wordpress" 
          element={
            <AdminRoute>
              <Suspense fallback={<LazyLoadFallback componentName="Gestion WordPress" />}>
                <WordPressManagement />
              </Suspense>
            </AdminRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <AdminRoute adminOnly>
              <Suspense fallback={<LazyLoadFallback componentName="Gestion des utilisateurs" />}>
                <UserManagement />
              </Suspense>
            </AdminRoute>
          } 
        />
        <Route 
          path="/websites" 
          element={
            <AdminRoute adminOnly>
              <Suspense fallback={<LazyLoadFallback componentName="Gestion des sites web" />}>
                <WebsiteManagement />
              </Suspense>
            </AdminRoute>
          } 
        />
        <Route 
          path="/google-business" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyLoadFallback componentName="Google Business" />}>
                <GoogleBusinessPage />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback routes */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default AppRoutes;
