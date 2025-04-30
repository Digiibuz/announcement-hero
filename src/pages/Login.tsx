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

// Initialisation immédiate avant tout autre code
(() => {
  // Bloquer complètement l'affichage des URLs et erreurs sensibles
  
  // Stocker les fonctions originales
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalFetch = window.fetch;
  
  // Remplacer définitivement console.log
  console.log = function(...args) {
    // Bloquer complètement les logs sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Remplacer définitivement console.error
  console.error = function(...args) {
    // Bloquer complètement les logs d'erreur sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleError.apply(console, args);
  };
  
  // Remplacer définitivement console.warn
  console.warn = function(...args) {
    // Bloquer complètement les logs d'avertissement sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleWarn.apply(console, args);
  };
  
  // Remplacer fetch pour masquer complètement les URLs sensibles
  window.fetch = function(input, init) {
    // Vérifier si l'URL est sensible
    const url = input instanceof Request ? input.url : String(input);
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(url));
    
    if (isSensitive) {
      // Bloquer complètement les erreurs pour cette requête
      const errorHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        return true;
      };
      
      // Installer des gestionnaires d'erreurs temporaires
      window.addEventListener('error', errorHandler, true);
      window.addEventListener('unhandledrejection', errorHandler, true);
      
      // Exécuter la requête silencieusement
      const promise = originalFetch(input, init);
      
      // Nettoyer les gestionnaires après un court délai
      setTimeout(() => {
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', errorHandler, true);
      }, 1000);
      
      return promise;
    }
    
    // Pour les requêtes non sensibles, comportement normal
    return originalFetch(input, init);
  };
})();

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

  // Remplace les intercepteurs basiques par des plus agressifs
  useEffect(() => {
    // Fonction qui bloque et remplace toute URL sensible par une URL factice
    const replaceAuthRequest = () => {
      // Remplacer XMLHttpRequest.prototype.open
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        // URL factice pour les requêtes d'auth
        const urlStr = String(url);
        if (urlStr.includes('auth') || urlStr.includes('supabase') || 
            urlStr.includes('token') || urlStr.includes('password')) {
          return originalOpen.call(this, method, "https://api-secure.example.com/auth", ...args);
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      // Remplacer window.fetch pour les requêtes sensibles
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        if (input instanceof Request) {
          // Créer une nouvelle requête avec une URL factice si sensible
          const url = input.url;
          if (url.includes('auth') || url.includes('supabase') || 
              url.includes('token') || url.includes('password')) {
            // Créer une nouvelle requête avec la même méthode et corps mais URL différente
            input = new Request("https://api-secure.example.com/auth", {
              method: input.method,
              headers: input.headers,
              body: input.body,
              mode: input.mode,
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity
            });
          }
        } else if (typeof input === 'string') {
          // Remplacer les URLs string sensibles
          if (input.includes('auth') || input.includes('supabase') || 
              input.includes('token') || input.includes('password')) {
            input = "https://api-secure.example.com/auth";
          }
        }
        return originalFetch(input, init);
      };
    };
    
    // Installer les intercepteurs avancés
    replaceAuthRequest();
    
    // Nettoyer au démontage
    return () => {
      // La restauration des prototypes n'est pas possible ici car ils sont modifiés globalement
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
      
      // Désactiver complètement TOUS les logs pendant l'authentification
      console.error = function(){};
      console.warn = function(){};
      console.log = function(){};
      
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
        // Restaurer les fonctions console avec un délai
        setTimeout(() => {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          console.log = originalConsoleLog;
        }, 1000);
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
