
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
  const [isLoading, setIsLoading] = useState(false); // Changé à false car le client est maintenant initialisé directement
  
  // Nous n'avons plus besoin de vérifier l'initialisation du client car il est créé directement
  // avec les informations d'authentification codées en dur
  
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
