
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
      refetchOnWindowFocus: false,  // Désactiver complètement le rechargement lors du focus
      refetchOnReconnect: false,    // Désactiver le rechargement lors de la reconnexion
      staleTime: 1000 * 60 * 10,    // 10 minutes au lieu de 5
      retry: 1,                     // Limiter les nouvelles tentatives
      networkMode: 'always',        // Continuer à fonctionner hors ligne
    },
  },
});

// Composant qui gère les événements du cycle de vie de l'application SANS rechargements
const AppLifecycleManager = () => {
  useAppLifecycle({
    onResume: () => {
      // Mise à jour des données en arrière-plan SANS invalider les requêtes
      console.log('Application reprise, navigation fluide préservée');
      
      // Optionnel : invalider seulement les requêtes très anciennes et de manière très sélective
      setTimeout(() => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            // N'invalider que les requêtes qui ont plus de 30 minutes et sont critiques
            const queryTime = query.state.dataUpdatedAt;
            const thirtyMinutesAgo = Date.now() - 1000 * 60 * 30;
            const isCriticalQuery = query.queryKey.includes('user') || query.queryKey.includes('auth');
            return queryTime < thirtyMinutesAgo && isCriticalQuery;
          }
        });
      }, 5000); // Délai de 5 secondes pour éviter les conflits
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
