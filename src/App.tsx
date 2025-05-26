
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import AppRoutes from "@/components/routing/Routes";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";

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
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <ImpersonationBanner />
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
