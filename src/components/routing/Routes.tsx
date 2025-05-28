
import React from 'react';
import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Announcements from "@/pages/Announcements";
import CreateAnnouncement from "@/pages/CreateAnnouncement";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import WordPressManagement from "@/pages/WordPressManagement";
import UserManagement from "@/pages/UserManagement";
import UserProfile from "@/pages/UserProfile";
import GoogleBusinessPage from "@/pages/GoogleBusinessPage";
import WebsiteManagement from "@/pages/WebsiteManagement";
import Templates from "@/pages/Templates";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  // Fonction pour vérifier si nous avons un token de récupération
  const hasRecoveryToken = () => {
    return window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token');
  };

  return (
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
      
      {/* Route spéciale pour reset-password - accessible même si connecté avec token de récupération */}
      <Route 
        path="/reset-password" 
        element={
          (!isAuthenticated || hasRecoveryToken()) ? (
            <ResetPassword />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />
      
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
        path="/templates" 
        element={
          <ProtectedRoute>
            <Templates />
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
  );
};

export default AppRoutes;
