
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Loader2, RefreshCcw } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { initializeSecureClient, supabase, withInitializedClient, cleanupAuthState } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fonction pour réinitialiser l'état d'authentification et tenter une nouvelle initialisation
  const handleReinitialize = async () => {
    setInitError(null);
    setIsInitializing(true);
    try {
      toast.info("Réinitialisation de la connexion en cours...");
      // Nettoyage complet de l'état d'authentification
      await cleanupAuthState();
      // Nouvel essai d'initialisation
      const success = await initializeSecureClient();
      if (success) {
        toast.success("Connexion au serveur rétablie");
        setIsInitializing(false);
      } else {
        setInitError("Échec de la réinitialisation. Veuillez rafraîchir la page.");
        setIsInitializing(false);
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      setInitError("Erreur lors de la réinitialisation");
      setIsInitializing(false);
    }
  };

  // Amélioration: Vérification plus robuste de l'initialisation
  useEffect(() => {
    // Vérifier l'initialisation du client Supabase avec retry
    const initClient = async () => {
      try {
        console.log("Initialisation du client Supabase...");
        const success = await initializeSecureClient();
        
        if (success) {
          console.log("Client Supabase initialisé avec succès");
          // Vérifier que nous pouvons effectivement récupérer une session comme test
          try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Erreur lors de la vérification de la session:", error);
              setInitError("Problème de connexion avec le serveur d'authentification");
              setIsInitializing(false);
            } else {
              console.log("Connexion établie avec le serveur d'authentification");
              setIsInitializing(false);
              setInitError(null);
            }
          } catch (e) {
            console.error("Erreur lors de la vérification de session:", e);
            setInitError("Erreur de communication avec le serveur");
            setIsInitializing(false);
          }
        } else {
          console.error("Échec de l'initialisation du client Supabase");
          setInitError("Problème de connexion avec le serveur");
          setIsInitializing(false);
        }
      } catch (error) {
        console.error("Erreur critique lors de l'initialisation:", error);
        setInitError("Impossible de se connecter au serveur");
        setIsInitializing(false);
      }
    };
    
    initClient();
  }, []);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Utilisateur déjà authentifié, redirection vers le tableau de bord");
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isInitializing) {
      toast.error("Le système d'authentification est en cours d'initialisation, veuillez patienter");
      return;
    }
    
    if (initError) {
      toast.error("Veuillez réinitialiser la connexion avant de vous connecter");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Tentative de connexion...");
      
      // Nettoyage de l'état d'authentification avant de tenter le login
      await cleanupAuthState();
      
      // Vérifier que le client est correctement initialisé avant la connexion
      await withInitializedClient(async () => {
        // Test de vérification de l'état du client avant login
        try {
          const { data: sessionCheck } = await supabase.auth.getSession();
          console.log("État de session avant login:", sessionCheck ? "OK" : "Pas de session");
        } catch (e) {
          console.error("Erreur de vérification avant login:", e);
        }
        
        await login(email, password);
        console.log("Connexion réussie");
        toast.success("Connexion réussie");
        
        // Redirection après connexion réussie
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      });
    } catch (error: any) {
      console.error("Erreur de connexion complète:", error);
      
      // Messages d'erreur plus descriptifs
      if (error.message?.includes("Invalid login")) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.message?.includes("Invalid API key")) {
        toast.error("Problème de configuration du serveur. Veuillez réessayer ou contacter l'administrateur.");
        // Tentative de réinitialisation automatique
        await handleReinitialize();
      } else if (error.message?.includes("network")) {
        toast.error("Problème de connexion réseau. Vérifiez votre connexion internet");
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
            {isInitializing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Initialisation de la connexion sécurisée...</p>
              </div>
            ) : initError ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="text-destructive text-center mb-2">
                  <p className="font-medium mb-1">Erreur de connexion</p>
                  <p className="text-sm text-muted-foreground">{initError}</p>
                </div>
                <Button 
                  onClick={handleReinitialize} 
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Réinitialiser la connexion
                </Button>
              </div>
            ) : (
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
                
                <Button type="submit" className="w-full" disabled={isLoading || isInitializing || !!initError}>
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
            )}
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
