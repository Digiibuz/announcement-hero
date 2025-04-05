
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, isAuthenticated, sessionChecked, authError, isProcessingCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPageLoaded(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.children.length < 2) {
        console.log('Page de login potentiellement corrompue, marquer comme erreur');
        setLoadingError(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Redirect if already authenticated, but only after session check is complete
  useEffect(() => {
    if (sessionChecked && isAuthenticated) {
      console.log("User is already authenticated, redirecting to dashboard");
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, navigate, sessionChecked]);

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener in Login component");
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in Login component:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        console.log("User signed in successfully in Login component", session.user.id);
        toast.success("Connexion réussie");
        setIsGoogleLoading(false);
        setLocalError(null);
        
        // Give a small delay for context to update
        setTimeout(() => {
          console.log("Navigating to dashboard after auth state change");
          navigate("/dashboard");
        }, 500);
      } else if (event === 'USER_UPDATED' && session) {
        console.log("User updated in Login component");
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out in Login component");
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log("Token refreshed in Login component");
      }
    });

    return () => {
      console.log("Cleaning up auth listener in Login component");
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      setLocalError(error.message || "Échec de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setLocalError(null);
      console.log("Initiating Google sign-in");
      
      // Store a flag indicating Google auth is in progress
      sessionStorage.setItem('google_auth_in_progress', 'true');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile',
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) {
        console.error("Erreur de connexion Google:", error);
        setLocalError(error.message || "Échec de la connexion avec Google");
        setIsGoogleLoading(false);
        sessionStorage.removeItem('google_auth_in_progress');
      } else if (data?.url) {
        console.log("Google auth initiated, redirecting to:", data.url);
        // Instead of immediately redirecting, wait a moment to ensure everything is ready
        setTimeout(() => {
          window.location.href = data.url;
        }, 100);
      } else {
        console.error("No redirect URL received from Supabase");
        setLocalError("Erreur: Aucune URL de redirection reçue");
        setIsGoogleLoading(false);
        sessionStorage.removeItem('google_auth_in_progress');
      }
    } catch (error: any) {
      console.error("Exception lors de la connexion Google:", error);
      setLocalError("Erreur lors de la connexion avec Google");
      setIsGoogleLoading(false);
      sessionStorage.removeItem('google_auth_in_progress');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForceReload = () => {
    if (window.clearCacheAndReload) {
      window.clearCacheAndReload();
    } else {
      window.location.reload();
    }
  };

  // Display any auth errors
  const displayError = localError || authError;

  // If we're processing a callback, don't show the login page
  if (isProcessingCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentification en cours</CardTitle>
            <CardDescription>
              Nous finalisons votre connexion, veuillez patienter...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            
            {displayError && (
              <Alert className="bg-destructive/10 border-destructive/20 mt-4">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  {displayError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Problème de chargement</CardTitle>
            <CardDescription>
              La page ne semble pas s'être chargée correctement.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleForceReload}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recharger l'application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render the login form if not authenticated
  if (sessionChecked && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Vous êtes déjà connecté</CardTitle>
            <CardDescription>
              Redirection vers le tableau de bord...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onError={(e) => {
                  console.error("Erreur de chargement de l'image:", e);
                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzM2E0NSIgLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RGlnaWlCdXo8L3RleHQ+PC9zdmc+";
                }}
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
            {displayError && (
              <Alert className="bg-destructive/10 border-destructive/20 mb-4">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  {displayError}
                </AlertDescription>
              </Alert>
            )}
            
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion Google en cours...
                  </div>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23 17.45 20.53 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Connexion avec Google
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

declare global {
  interface Window {
    clearCacheAndReload: () => void;
  }
}

export default Login;
