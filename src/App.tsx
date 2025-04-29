
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { SupabaseConfigProvider } from "./context/SupabaseConfigContext";
import { StartupScreen } from "./components/ui/startup-screen";
import { AppRoutes } from "./routes/AppRoutes";
import { OfflineBanner } from "./components/ui/offline-banner";
import { NetworkListener } from "./components/ui/network-listener";
import { queryClient } from "./utils/query-client";

function App() {
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
                <AppRoutes />
                <SonnerToaster />
                <UIToaster />
              </TooltipProvider>
            </AuthProvider>
          </SupabaseConfigProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
