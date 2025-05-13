
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Routes } from "@/components/routing/Routes";
import { useAppLifecycle } from "./hooks/useAppLifecycle";
import { useEffect, useState } from "react";
import { supabase, isSupabaseInitialized, getSupabaseInitializationError } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Composant qui gère les événements du cycle de vie de l'application
const AppLifecycleManager = () => {
  useAppLifecycle({
    onResume: () => {
      // Rafraîchir les données si nécessaire sans recharger la page
      console.log('Application reprise, rafraîchissement des données...');
      queryClient.invalidateQueries();
    },
    onHide: () => {
      console.log('Application masquée, sauvegarde de l\'état...');
    }
  });
  return null;
};

// Composant pour gérer l'initialisation de Supabase
const SupabaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        if (isSupabaseInitialized()) {
          // Supabase est déjà initialisé avec succès
          setIsLoading(false);
          return;
        }
        
        // Vérifier s'il y a une erreur d'initialisation
        const error = getSupabaseInitializationError();
        if (error && retryCount >= MAX_RETRIES) {
          // Trop de tentatives échouées
          throw error;
        }
        
        // Attendre un peu avant de réessayer
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * Math.pow(2, retryCount)); // Délai exponentiel
        }
        
      } catch (error) {
        console.error("Erreur lors de l'initialisation de Supabase:", error);
        // Laisser l'état isLoading=false pour afficher l'écran d'erreur
        setIsLoading(false);
      }
    };

    if (isLoading) {
      checkInitialization();
    }
  }, [isLoading, retryCount]);

  // Afficher un écran d'erreur en cas d'échec après plusieurs tentatives
  if (!isLoading && getSupabaseInitializationError() && retryCount >= MAX_RETRIES) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <div className="p-8 rounded-lg shadow-lg bg-white dark:bg-gray-800 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de connexion</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.
          </p>
          <button
            onClick={() => {
              setRetryCount(0);
              setIsLoading(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Afficher un indicateur de chargement pendant l'initialisation
  if (isLoading && !isSupabaseInitialized()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2 text-gray-600 dark:text-gray-300">
          Initialisation de l'application...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <SupabaseInitializer>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <AppLifecycleManager />
                <Routes />
                <SonnerToaster />
                <UIToaster />
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </SupabaseInitializer>
  );
}

export default App;
