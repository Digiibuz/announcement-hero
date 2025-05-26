
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

// Lazy loaded components
const Announcements = lazy(() => import('@/pages/Announcements'));
const CreateAnnouncement = lazy(() => import('@/pages/CreateAnnouncement'));
const AnnouncementDetail = lazy(() => import('@/pages/AnnouncementDetail'));
const WordPressManagement = lazy(() => import('@/pages/WordPressManagement'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const GoogleBusinessPage = lazy(() => import('@/pages/GoogleBusinessPage'));
const WebsiteManagement = lazy(() => import('@/pages/WebsiteManagement'));

const AppRoutes = () => {
  const { isAuthenticated, isOnResetPasswordPage } = useAuth();

  return (
    <Suspense fallback={<div>Chargement...</div>}>
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
        
        {/* Admin routes */}
        <Route 
          path="/wordpress" 
          element={
            <AdminRoute>
              <WordPressManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <AdminRoute adminOnly>
              <UserManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="/websites" 
          element={
            <AdminRoute adminOnly>
              <WebsiteManagement />
            </AdminRoute>
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
        
        {/* Fallback routes */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default AppRoutes;
