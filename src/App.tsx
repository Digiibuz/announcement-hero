
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
import { getSupabaseClient } from "./integrations/supabase/client";
import { toast } from "sonner";

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

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialiser le client Supabase dès le chargement de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await getSupabaseClient();
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        setInitError(error.message || "Une erreur s'est produite pendant l'initialisation");
        toast.error("Problème de connexion au serveur. Veuillez vérifier votre connexion internet et rafraîchir la page.");
      }
    };

    initializeApp();
  }, []);

  // Afficher un écran de chargement pendant l'initialisation ou en cas d'erreur
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement de l'application...</p>
          {initError && (
            <p className="mt-2 text-red-500 max-w-md text-sm">
              {initError}
            </p>
          )}
          {initError && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
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
  );
}

export default App;
