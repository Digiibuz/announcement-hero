
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import AppRoutes from "@/components/routing/Routes";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import DynamicBackground from "@/components/ui/DynamicBackground";
import MobileBottomNav from "@/components/ui/layout/MobileBottomNav";
import UpdateNotification from "@/components/ui/UpdateNotification";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useVersionTracking } from "@/hooks/useVersionTracking";

// Configuration React Query sans refetch automatique
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Empêche les refetch sur changement de fenêtre
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // Les données ne deviennent jamais stale
    },
  },
});

function AppContent() {
  // Initialize service worker for manual updates
  const { updateAvailable, updateApp, dismissUpdate } = useServiceWorker();
  
  // Initialize version tracking
  useVersionTracking();

  return (
    <TooltipProvider>
      <DynamicBackground className="min-h-screen">
        <ImpersonationBanner />
        <AppRoutes />
        <MobileBottomNav />
        {updateAvailable && (
          <UpdateNotification 
            onUpdate={updateApp}
            onDismiss={dismissUpdate}
          />
        )}
      </DynamicBackground>
      <SonnerToaster />
      <UIToaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
