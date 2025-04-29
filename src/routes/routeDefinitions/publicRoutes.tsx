
import { Navigate, RouteObject } from "react-router-dom";
import { lazyWithRetry } from "@/utils/lazyLoad";
import Login from "@/pages/Login";

// Lazy loading public pages
const ForgotPassword = lazyWithRetry(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("@/pages/ResetPassword"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"), (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <h1 className="text-xl font-bold">Page not found</h1>
    <p className="mt-2">The page you are looking for does not exist.</p>
  </div>
));

// Define public routes that don't require authentication
export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "*",
    element: <NotFound />,
  }
];
