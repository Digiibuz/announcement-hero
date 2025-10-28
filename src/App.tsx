
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
import { useDeepLinkHandler } from "@/utils/deepLinkHandler";

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
  useDeepLinkHandler();
  
  return (
    <>
      <DynamicBackground className="min-h-screen">
        <ImpersonationBanner />
        <AppRoutes />
        <MobileBottomNav />
      </DynamicBackground>
      <SonnerToaster />
      <UIToaster />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
