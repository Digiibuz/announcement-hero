
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { testSupabaseConnection } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/auth/LoginForm";
import { NetworkErrorBanner } from "@/components/auth/NetworkErrorBanner";
import { BrandLogo } from "@/components/auth/BrandLogo";

const Login = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { isAuthenticated, isNetworkError, retryConnection } = useAuth();
  const navigate = useNavigate();

  // Vérifier la connexion au serveur lors du chargement
  useEffect(() => {
    const checkServerConnection = async () => {
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        toast.error("Impossible de se connecter au serveur", {
          description: "Vérifiez votre connexion internet ou réessayez plus tard."
        });
      }
    };
    
    checkServerConnection();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const success = await retryConnection();
      const isConnected = await testSupabaseConnection();
      if (isConnected && success) {
        toast.success("Connexion rétablie");
      } else {
        toast.error("Échec de la reconnexion");
      }
    } catch (error) {
      console.error("Échec de la reconnexion:", error);
      toast.error("Impossible de se reconnecter");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <ImpersonationBanner />
      <AnimatedContainer direction="up" className="w-full max-w-md">
        {isNetworkError && (
          <NetworkErrorBanner 
            isRetrying={isRetrying} 
            onRetry={handleRetryConnection} 
          />
        )}
        
        <Card className="glass-panel shadow-lg border-white/20">
          <BrandLogo />
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Connexion
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm isRetrying={isRetrying} />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
              Contactez votre administrateur si vous n'avez pas de compte
            </p>
          </CardFooter>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default Login;
