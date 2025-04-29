
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { lazyWithRetry } from "@/utils/lazyLoad";

// Lazy loading protected pages
const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const Announcements = lazyWithRetry(() => import("@/pages/Announcements"));
const AnnouncementDetail = lazyWithRetry(() => import("@/pages/AnnouncementDetail"));
const CreateAnnouncement = lazyWithRetry(() => import("@/pages/CreateAnnouncement"));
const UserProfile = lazyWithRetry(() => import("@/pages/UserProfile"));
const Support = lazyWithRetry(() => import("@/pages/Support"));
const GoogleBusinessPage = lazyWithRetry(() => import("@/pages/GoogleBusinessPage"));

// Define routes that require authentication
export const protectedRoutes: RouteObject[] = [
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/announcements",
    element: (
      <ProtectedRoute>
        <Announcements />
      </ProtectedRoute>
    )
  },
  {
    path: "/announcements/:id",
    element: (
      <ProtectedRoute>
        <AnnouncementDetail />
      </ProtectedRoute>
    )
  },
  {
    path: "/create",
    element: (
      <ProtectedRoute>
        <CreateAnnouncement />
      </ProtectedRoute>
    )
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    )
  },
  {
    path: "/support",
    element: (
      <ProtectedRoute>
        <Support />
      </ProtectedRoute>
    )
  },
  {
    path: "/google-business",
    element: (
      <ProtectedRoute>
        <GoogleBusinessPage />
      </ProtectedRoute>
    )
  }
];
