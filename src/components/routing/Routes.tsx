
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Suspense, lazy } from 'react';
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import Login from "@/pages/Login";

// Lazy loading pages
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CreateAnnouncement = lazy(() => import("@/pages/CreateAnnouncement"));
const Announcements = lazy(() => import("@/pages/Announcements"));
const AnnouncementDetail = lazy(() => import("@/pages/AnnouncementDetail"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const WordPressManagement = lazy(() => import("@/pages/WordPressManagement"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Support = lazy(() => import("@/pages/Support"));
const GoogleBusinessPage = lazy(() => import("@/pages/GoogleBusinessPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingIndicator variant="dots" size={42} />
  </div>
);

export const Routes = () => (
  <Suspense fallback={<LoadingFallback />}>
    <RouterRoutes>
      {/* Redirect root to dashboard if logged in, otherwise to login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="/announcements/:id" element={<ProtectedRoute><AnnouncementDetail /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateAnnouncement /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/google-business" element={<ProtectedRoute><GoogleBusinessPage /></ProtectedRoute>} />
      
      {/* Admin/Client only routes */}
      <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/wordpress" element={<AdminRoute><WordPressManagement /></AdminRoute>} />
      
      {/* Fallback route */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  </Suspense>
);
