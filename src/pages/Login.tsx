
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Loader2, RefreshCcw, WifiOff } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { login, isAuthenticated, isNetworkError, retryConnection } = useAuth();
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
      await retryConnection();
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      
      // Redirect after successful login
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // More descriptive error message based on error type
      if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('internet')) {
        toast.error("Problème de connexion au serveur", {
          description: "Veuillez vérifier votre connexion internet ou réessayer plus tard."
        });
      } else if (error.message?.includes('Invalid login') || error.message?.includes('mot de passe incorrect')) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.message?.includes('JSON') || error.message?.includes('communication')) {
        toast.error("Erreur de communication avec le serveur", {
          description: "Veuillez réessayer dans quelques instants."
        });
      } else {
        toast.error(error.message || "Échec de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <ImpersonationBanner />
      <AnimatedContainer direction="up" className="w-full max-w-md">
        {isNetworkError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">Problème de connexion au serveur</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800/50"
              onClick={handleRetryConnection}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-1" />
              )}
              Réessayer
            </Button>
          </div>
        )}
        
        <Card className="glass-panel shadow-lg border-white/20">
          <div className="flex justify-center pt-6">
            <div className="flex flex-col items-center">
              <img 
                src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
                alt="DigiiBuz" 
                className="h-16 w-auto mb-2"
              />
              <span className="text-xl font-bold text-digibuz-navy dark:text-digibuz-yellow">
                DigiiBuz
              </span>
            </div>
          </div>
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
            <form onSubmit={handleSubmit} className="space-y-4">              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  autoComplete="email"
                  disabled={isLoading || isRetrying}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs" 
                    type="button" 
                    disabled={isLoading || isRetrying}
                    asChild
                  >
                    <Link to="/forgot-password">Mot de passe oublié ?</Link>
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || isRetrying}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading || isRetrying}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || isRetrying}>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
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
