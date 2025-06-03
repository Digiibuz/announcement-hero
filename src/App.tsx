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
import VersionIndicator from "@/components/ui/VersionIndicator";

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

function App() {
  const { updateAvailable, updateApp, setUpdateAvailable } = useServiceWorker();

  const handleDismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <DynamicBackground className="min-h-screen">
              <ImpersonationBanner />
              <AppRoutes />
              <MobileBottomNav />
              <VersionIndicator />
              {updateAvailable && (
                <UpdateNotification 
                  onUpdate={updateApp}
                  onDismiss={handleDismissUpdate}
                />
              )}
            </DynamicBackground>
            <SonnerToaster />
            <UIToaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
