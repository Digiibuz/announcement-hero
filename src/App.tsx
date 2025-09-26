
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import DynamicBackground from "@/components/ui/DynamicBackground";

// Configuration React Query - Nouvelle instance pour éviter les conflits
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, 
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  },
});

function App() {
  console.log("App without router is rendering");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <DynamicBackground className="min-h-screen">
            <div className="container mx-auto p-8">
              <h1 className="text-4xl font-bold text-center mb-8">Application Digibuz</h1>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Bienvenue</h2>
                <p className="text-gray-600 mb-4">
                  L'application fonctionne maintenant sans problème de router.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Dashboard</h3>
                    <p className="text-blue-700">Accédez à votre tableau de bord</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900">Annonces</h3>
                    <p className="text-green-700">Gérez vos annonces</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900">Profil</h3>
                    <p className="text-purple-700">Gérez votre profil</p>
                  </div>
                </div>
              </div>
            </div>
          </DynamicBackground>
          <SonnerToaster />
          <UIToaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
