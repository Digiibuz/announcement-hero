import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect, useState } from 'react';
import { LoadingIndicator } from "./components/ui/loading-indicator";
import { toast } from "sonner";
import Login from "./pages/Login";
import { SupabaseConfigProvider } from "./context/SupabaseConfigContext";
import { StartupScreen } from "./components/ui/startup-screen";

// Optimized lazy loading with error boundaries and retry logic
function lazyWithRetry(factory, fallback = null) {
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
}

// Lazy loading other pages for performance with optimizations for slow networks
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const CreateAnnouncement = lazyWithRetry(() => import("./pages/CreateAnnouncement"));
const Announcements = lazyWithRetry(() => import("./pages/Announcements"));
const AnnouncementDetail = lazyWithRetry(() => import("./pages/AnnouncementDetail"));
const UserManagement = lazyWithRetry(() => import("./pages/UserManagement"));
const WordPressManagement = lazyWithRetry(() => import("./pages/WordPressManagement"));
const UserProfile = lazyWithRetry(() => import("./pages/UserProfile"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const GoogleBusinessPage = lazyWithRetry(() => import("./pages/GoogleBusinessPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <h1 className="text-xl font-bold">Page non trouvée</h1>
    <p className="mt-2">La page que vous recherchez n'existe pas.</p>
  </div>
));

// Composant de chargement amélioré avec détection réseau et conseils
const LoadingFallback = ({ message }: { message?: string }) => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  
  useEffect(() => {
    // Détecter si sur réseau lent
    if (window.isOnSlowNetwork) {
      setIsSlowNetwork(window.isOnSlowNetwork());
    }
    
    // Minuteur pour mesurer le temps de chargement
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Affichage adapté selon le temps de chargement
  const getLoadingMessage = () => {
    if (!message) {
      if (isSlowNetwork) {
        return "Chargement sur connexion lente...";
      }
      
      if (loadingTime > 10) {
        return "Le chargement prend plus de temps que prévu. Merci de patienter...";
      }
      
      if (loadingTime > 5) {
        return "Chargement en cours...";
      }
      
      return "Chargement...";
    }
    
    return message;
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <LoadingIndicator variant="dots" size={42} />
      <p className="mt-4 text-center text-muted-foreground">
        {getLoadingMessage()}
      </p>
      
      {isSlowNetwork && loadingTime > 3 && (
        <p className="max-w-xs text-center text-xs text-muted-foreground mt-2">
          Connexion lente détectée. Optimisation des ressources en cours...
        </p>
      )}
      
      {loadingTime > 15 && (
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80"
        >
          Recharger la page
        </button>
      )}
    </div>
  );
};

// Configuration de React Query avec optimisations réseau
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Paramètres généraux
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Stratégie de retry adaptative au réseau
      retry: (failureCount, error: any) => {
        // Limiter le nombre de retries sur réseau lent
        const isSlowNetwork = window.isOnSlowNetwork ? window.isOnSlowNetwork() : false;
        const maxRetries = isSlowNetwork ? 2 : 3;
        
        // Ne pas réessayer pour certaines erreurs comme 404, 401, etc.
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        
        return failureCount < maxRetries;
      },
      
      // Temps entre les retries adapté au réseau
      retryDelay: (attemptIndex) => {
        const isSlowNetwork = window.isOnSlowNetwork ? window.isOnSlowNetwork() : false;
        const baseDelay = isSlowNetwork ? 2000 : 1000;
        return Math.min(baseDelay * (2 ** attemptIndex), 30000);
      },
    },
  },
});

// Écouteur d'état réseau pour afficher des notifications réseau
const NetworkListener = () => {
  useEffect(() => {
    const handleConnectionChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail?.online === false) {
        toast.warning("Connexion internet perdue", {
          description: "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.",
          duration: 5000,
        });
      } else if (detail?.online === true) {
        toast.success("Connexion internet rétablie", {
          duration: 3000,
        });
      }
    };
    
    window.addEventListener('connectionchange', handleConnectionChange);
    
    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('connectionchange', handleConnectionChange);
    };
  }, []);
  
  return null;
};

// Protected route component with improved memory and network awareness
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isOnResetPasswordPage } = useAuth();
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Ne pas vérifier l'authentification si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      sessionStorage.setItem('lastAuthenticatedPath', location.pathname);
    }
    
    // Marquer la fin du chargement initial
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [location.pathname, isAuthenticated, isLoading, isOnResetPasswordPage, isInitialLoad]);

  // Affichage pendant le chargement adapté au réseau
  if (isLoading) {
    return <LoadingFallback message={isInitialLoad ? "Vérification de l'authentification..." : undefined} />;
  }

  // Si on est sur la page de réinitialisation, on laisse passer même si non authentifié
  if (!isAuthenticated && !isOnResetPasswordPage) {
    // Vérifier si hash contient un token de récupération
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    if (location.pathname === '/reset-password' && hasRecoveryToken) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin only route component with improved state persistence
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAdmin, isClient, isOnResetPasswordPage } = useAuth();
  const location = useLocation();

  // Enhanced admin route persistence
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnResetPasswordPage) {
      if (isAdmin || isClient) {
        console.log("Saving admin path:", location.pathname);
        sessionStorage.setItem('lastAdminPath', location.pathname);
      }
    }
  }, [location.pathname, isAuthenticated, isAdmin, isClient, isLoading, isOnResetPasswordPage]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Si on est sur la page de réinitialisation, on laisse passer même si non authentifié
  if (!isAuthenticated && !isOnResetPasswordPage) {
    // Vérifier si hash contient un token de récupération
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    if (location.pathname === '/reset-password' && hasRecoveryToken) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  // Autoriser l'accès aux utilisateurs admin et client
  if (!isAdmin && !isClient && !isOnResetPasswordPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Surveillance de l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Affichage d'une bannière offline si l'utilisateur est hors ligne
  const OfflineBanner = () => {
    if (isOnline) return null;
    
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
        <span className="font-medium">Mode hors ligne activé</span> - Certaines fonctionnalités sont limitées
      </div>
    );
  };

  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          {/* Ajout du SupabaseConfigProvider avant AuthProvider */}
          <SupabaseConfigProvider>
            {/* Écran de démarrage pour la configuration initiale */}
            <StartupScreen />
            
            <AuthProvider>
              <TooltipProvider>
                <OfflineBanner />
                <NetworkListener />
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
                  <SonnerToaster />
                  <UIToaster />
                </Suspense>
              </TooltipProvider>
            </AuthProvider>
          </SupabaseConfigProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
