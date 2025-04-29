
import { RouteObject } from "react-router-dom";
import { AdminRoute } from "../AdminRoute";
import { lazyWithRetry } from "@/utils/lazyLoad";

// Lazy loading admin pages
const UserManagement = lazyWithRetry(() => import("@/pages/UserManagement"));
const WordPressManagement = lazyWithRetry(() => import("@/pages/WordPressManagement"));

// Define routes that require admin or client privileges
export const adminRoutes: RouteObject[] = [
  {
    path: "/users",
    element: (
      <AdminRoute>
        <UserManagement />
      </AdminRoute>
    )
  },
  {
    path: "/wordpress",
    element: (
      <AdminRoute>
        <WordPressManagement />
      </AdminRoute>
    )
  }
];
