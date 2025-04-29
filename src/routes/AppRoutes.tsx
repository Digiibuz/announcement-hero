
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import Login from "@/pages/Login";

// Optimized lazy loading with error boundaries and retry logic
const lazyWithRetry = (factory, fallback = null) => {
  const Component = lazy(() => {
    return new Promise((resolve, reject) => {
      // Fonction d'essai avec un compteur pour limiter les tentatives
      const tryImport = (retriesLeft = 2) => {
        factory()
          .then(resolve)
          .catch((error) => {
            // Afficher l'erreur en console pour diagnostic
            console.error("Erreur de chargement de module:", error);
            
            // Si nous avons dépassé le nombre de tentatives, rejeter avec l'erreur
            if (retriesLeft <= 0) {
              console.error("Échec du chargement après plusieurs tentatives.");
              reject(error);
              return;
            }
            
            // Sinon attendre et réessayer avec une attente exponentielle
            const delay = Math.pow(2, 3 - retriesLeft) * 1000; // 1s, 2s, 4s...
            console.log(`Nouvelle tentative de chargement dans ${delay}ms...`);
            
            setTimeout(() => {
              tryImport(retriesLeft - 1);
            }, delay);
          });
      };
      
      // Première tentative
      tryImport();
    });
  });
  
  // Renvoyer un composant qui gère les erreurs et permet une nouvelle tentative
  return (props) => {
    const [error, setError] = useState(null);
    
    if (error && !fallback) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <div className="rounded-lg border p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Erreur de chargement</h2>
            <p className="mb-4 text-muted-foreground">
              Impossible de charger cette page. Cela peut être dû à une connexion internet instable.
            </p>
            <button 
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    
    if (error && fallback) {
      return fallback;
    }
    
    try {
      return (
        <Component {...props} />
      );
    } catch (err) {
      setError(err);
      return null;
    }
  };
};

// Lazy loading pages
const ForgotPassword = lazyWithRetry(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("@/pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const CreateAnnouncement = lazyWithRetry(() => import("@/pages/CreateAnnouncement"));
const Announcements = lazyWithRetry(() => import("@/pages/Announcements"));
const AnnouncementDetail = lazyWithRetry(() => import("@/pages/AnnouncementDetail"));
const UserManagement = lazyWithRetry(() => import("@/pages/UserManagement"));
const WordPressManagement = lazyWithRetry(() => import("@/pages/WordPressManagement"));
const UserProfile = lazyWithRetry(() => import("@/pages/UserProfile"));
const Support = lazyWithRetry(() => import("@/pages/Support"));
const GoogleBusinessPage = lazyWithRetry(() => import("@/pages/GoogleBusinessPage"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"), (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <h1 className="text-xl font-bold">Page non trouvée</h1>
    <p className="mt-2">La page que vous recherchez n'existe pas.</p>
  </div>
));

import { useState } from 'react';

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Redirect root to dashboard if logged in, otherwise to login */}
        <Route path="/" element={
          <Navigate to="/dashboard" replace />
        } />
        
        {/* Public routes - accessibles sans authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
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
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/support" 
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
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
