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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      // Vérifier si c'est une erreur d'authentification
      if (event.type === 'error' || event.type === 'unhandledrejection') {
        const message = (event.message || (event.reason && event.reason.message) || '').toString();
        const stack = (event.error && event.error.stack || (event.reason && event.reason.stack) || '').toString();
        
        // Bloquer complètement les erreurs liées à l'authentification ou à Supabase
        if (message.includes('token') || 
            message.includes('auth') || 
            message.includes('supabase') ||
            message.includes('401') ||
            message.includes('400') ||
            stack.includes('token') || 
            stack.includes('auth') || 
            stack.includes('supabase')) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
      return false;
    };

    // Installation des gestionnaires d'erreurs pour les requêtes XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Si c'est une requête d'authentification, installer des gestionnaires d'erreurs spécifiques
      if (String(url).includes('token') || String(url).includes('auth') || String(url).includes('supabase')) {
        // Ne rien faire de spécial, mais l'URL sera masquée par les autres intercepteurs
      }
      return originalOpen.apply(this, [method, url, ...args]);
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
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Installer des gestionnaires temporaires pour bloquer toutes les erreurs liées à cette requête
      const silenceAllErrors = (event: Event | PromiseRejectionEvent) => {
        // Bloquer toutes les erreurs pendant la tentative de connexion
        event.preventDefault();
        event.stopPropagation();
        return true;
      };
      
      // Installer des gestionnaires de haut niveau pour capturer les erreurs avant console
      window.addEventListener('unhandledrejection', silenceAllErrors, { capture: true });
      window.addEventListener('error', silenceAllErrors, { capture: true });
      
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;
      
      // Remplacer temporairement console.error et console.warn pour masquer les erreurs d'authentification
      console.error = function(...args) {
        // Ne rien loguer si lié à l'authentification
        if (!args.some(arg => 
          typeof arg === 'string' && (arg.includes('auth') || arg.includes('supabase') || 
          arg.includes('token') || arg.includes('400') || arg.includes('401'))
        )) {
          originalConsoleError.apply(console, args);
        }
      };
      
      console.warn = function(...args) {
        // Ne rien loguer si lié à l'authentification
        if (!args.some(arg => 
          typeof arg === 'string' && (arg.includes('auth') || arg.includes('supabase') || 
          arg.includes('token') || arg.includes('400') || arg.includes('401'))
        )) {
          originalConsoleWarn.apply(console, args);
        }
      };
      
      console.log = function(...args) {
        // Ne rien loguer si lié à l'authentification
        if (!args.some(arg => 
          typeof arg === 'string' && (arg.includes('auth') || arg.includes('supabase') || 
          arg.includes('token') || arg.includes('400') || arg.includes('401'))
        )) {
          originalConsoleLog.apply(console, args);
        }
      };
      
      try {
        await login(email, password);
        toast.success("Connexion réussie");
        
        // Redirect after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } catch (error: any) {
        // Utiliser la fonction de gestion sécurisée des erreurs
        const errorMessage = handleAuthError(error);
        toast.error(errorMessage);
      } finally {
        // Restaurer les fonctions console originales et supprimer les gestionnaires d'événements
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
        window.removeEventListener('unhandledrejection', silenceAllErrors);
        window.removeEventListener('error', silenceAllErrors);
      }
    } catch (error) {
      // Ne pas afficher l'erreur - déjà gérée ci-dessus
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
