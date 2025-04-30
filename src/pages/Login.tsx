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

// Patterns sensibles à bloquer dans la console
const SENSITIVE_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /grant_type=password/i,
  /rdwqedmvzicerwotjseg/i,
  /index-[a-zA-Z0-9-_]+\.js/i
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Bloquer complètement les logs console standard
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Remplacer toutes les méthodes console pour bloquer les logs sensibles
    console.log = function(...args) {
      // Bloquer tous les logs liés à l'authentification ou aux URLs sensibles
      if (args.some(arg => {
        if (arg === undefined || arg === null) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return; // Ne rien logger
      }
      
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      // Bloquer tous les logs d'erreur liés à l'authentification ou aux URLs sensibles
      if (args.some(arg => {
        if (arg === undefined || arg === null) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return; // Ne rien logger
      }
      
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      // Bloquer tous les logs d'avertissement liés à l'authentification ou aux URLs sensibles
      if (args.some(arg => {
        if (arg === undefined || arg === null) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return; // Ne rien logger
      }
      
      originalConsoleWarn.apply(console, args);
    };
    
    // Nettoyer lors du démontage du composant
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Créer un intercepteur global pour bloquer toutes les requêtes d'authentification échouées
  useEffect(() => {
    // Fonction qui bloque et empêche l'affichage des erreurs d'authentification dans la console
    const blockAuthErrors = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return true;
    };

    // Installation des gestionnaires d'erreurs pour toutes les requêtes
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Si c'est une requête d'authentification, installer des gestionnaires d'erreurs spécifiques
      const urlStr = String(url);
      
      if (urlStr.includes('token') || 
          urlStr.includes('auth') || 
          urlStr.includes('supabase') ||
          SENSITIVE_PATTERNS.some(pattern => pattern.test(urlStr))) {
        this.addEventListener('error', blockAuthErrors, true);
        this.addEventListener('load', function() {
          // Bloquer les logs de réponse
          if (this.status === 400 || this.status === 401) {
            // Remplacer temporairement console.log et console.error
            const originalLog = console.log;
            const originalError = console.error;
            console.log = () => {};
            console.error = () => {};
            // Restaurer après un court délai
            setTimeout(() => {
              console.log = originalLog;
              console.error = originalError;
            }, 500); // Délai augmenté
          }
        }, true);
      }
      
      return originalOpen.apply(this, [method, url, ...args]);
    };

    // Intercepter fetch pour les requêtes d'authentification
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(url))) {
        // Installer des gestionnaires temporaires pour bloquer les logs
        window.addEventListener('error', blockAuthErrors, true);
        window.addEventListener('unhandledrejection', blockAuthErrors, true);
        
        // Exécuter la requête sans logger d'erreurs
        return originalFetch(input, init).finally(() => {
          // Supprimer les gestionnaires
          window.removeEventListener('error', blockAuthErrors, true);
          window.removeEventListener('unhandledrejection', blockAuthErrors, true);
        });
      }
      
      return originalFetch(input, init);
    };
    
    // Ajouter des écouteurs d'événements pour capturer les erreurs avant qu'elles n'atteignent la console
    window.addEventListener('error', blockAuthErrors, true);
    window.addEventListener('unhandledrejection', blockAuthErrors, true);
    
    return () => {
      // Nettoyer les écouteurs lors du démontage du composant
      window.removeEventListener('error', blockAuthErrors);
      window.removeEventListener('unhandledrejection', blockAuthErrors);
      
      // Restaurer les prototypes modifiés
      XMLHttpRequest.prototype.open = originalOpen;
      window.fetch = originalFetch;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Bloquer toutes les erreurs et logs pendant l'authentification
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;
      
      // Remplacer temporairement toutes les fonctions console
      console.error = () => {};
      console.warn = () => {};
      console.log = () => {};
      
      try {
        await login(email, password);
        toast.success("Connexion réussie");
        
        // Redirect after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } catch (error: any) {
        // Utiliser la fonction de gestion sécurisée des erreurs sans loguer de détails
        toast.error("Identifiants invalides. Veuillez vérifier votre email et mot de passe.");
      } finally {
        // Restaurer les fonctions console
        setTimeout(() => {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          console.log = originalConsoleLog;
        }, 1000); // Délai augmenté pour s'assurer que tous les logs sont supprimés
      }
    } catch (error) {
      // Ne pas afficher l'erreur
      toast.error("Identifiants invalides. Veuillez vérifier votre email et mot de passe.");
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
                    onClick={togglePasswordVisibility}
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
