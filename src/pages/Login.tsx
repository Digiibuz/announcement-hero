
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Loader2 } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { handleAuthError } from "@/utils/security";
import { SENSITIVE_PATTERNS } from "@/integrations/supabase/client";
import { usePersistedState } from "@/hooks/usePersistedState";

// Protection immédiate des logs - exécuté avant tout autre code
(function() {
  // Bloquer complètement TOUS les logs pendant l'authentification
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Remplacer définitivement console.log
  console.log = function(...args) {
    // Ne rien logger du tout
    return;
  };
  
  // Remplacer définitivement console.error
  console.error = function(...args) {
    // Ne rien logger du tout
    return;
  };
  
  // Remplacer définitivement console.warn
  console.warn = function(...args) {
    // Ne rien logger du tout
    return;
  };
  
  // Remplacer fetch pour bloquer complètement les erreurs
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    // Masquer toutes les erreurs pour toutes les requêtes
    try {
      const promise = originalFetch(input, init);
      
      // Intercepter les rejets de promesse
      promise.catch(() => {});
      
      return promise;
    } catch (e) {
      // Retourner une promesse qui ne se rejette jamais
      return new Promise(() => {});
    }
  };
  
  // Intercepter tous les événements d'erreur
  window.addEventListener('error', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, true);
  
  // Intercepter tous les rejets de promesse non gérés
  window.addEventListener('unhandledrejection', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, true);
})();

const Login = () => {
  const [email, setEmail] = usePersistedState("login_email", "");
  const [password, setPassword] = usePersistedState("login_password", "");
  const [showPassword, setShowPassword] = usePersistedState("login_show_password", false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Protection supplémentaire contre les erreurs réseau
  useEffect(() => {
    // Intercepter absolument TOUS les événements d'erreur pendant la durée de vie de ce composant
    const errorHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return true;
    };
    
    window.addEventListener('error', errorHandler, true);
    window.addEventListener('unhandledrejection', errorHandler, true);
    
    // Nettoyage
    return () => {
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('unhandledrejection', errorHandler, true);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      localStorage.setItem("login_success", new Date().toISOString());
      toast.success("Connexion réussie");
      
      // Rediriger après connexion réussie
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (error) {
      // Ne jamais logger l'erreur
      localStorage.setItem("login_error", "Identifiants invalides");
      toast.error("Identifiants invalides. Veuillez vérifier votre email et mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <ImpersonationBanner />
      <AnimatedContainer direction="up" className="w-full max-w-md">
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
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs" 
                    type="button" 
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
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
