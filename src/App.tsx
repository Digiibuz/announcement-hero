
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import AppRoutes from "@/components/routing/Routes";
import { useAppLifecycle } from "./hooks/useAppLifecycle";

// Configuration optimisée pour éviter les requêtes inutiles qui pourraient causer des rechargements
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Désactiver le rechargement lors du focus de la fenêtre
      staleTime: 1000 * 60 * 5,     // 5 minutes
      retry: 1,                     // Limiter les nouvelles tentatives
      networkMode: 'always',        // Continuer à fonctionner hors ligne
    },
  },
});

// Composant qui gère les événements du cycle de vie de l'application
const AppLifecycleManager = () => {
  useAppLifecycle({
    onResume: () => {
      // Rafraîchir les données si nécessaire sans recharger la page
      console.log('Application reprise, rafraîchissement des données en arrière-plan...');
      // Utiliser un invalidateQueries filtré pour éviter les rechargements massifs
      setTimeout(() => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            // N'invalider que les requêtes qui ont plus de 5 minutes
            const queryTime = query.state.dataUpdatedAt;
            const fiveMinutesAgo = Date.now() - 1000 * 60 * 5;
            return queryTime < fiveMinutesAgo;
          }
        });
      }, 1000);
    },
    onHide: () => {
      console.log('Application masquée, sauvegarde de l\'état...');
      // La sauvegarde est gérée par le hook lui-même
    }
  });
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <AppLifecycleManager />
              <AppRoutes />
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
