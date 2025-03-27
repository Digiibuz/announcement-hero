
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const { login, isAuthenticated, isImpersonating, stopImpersonating, originalUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up process
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        });

        if (error) throw error;
        
        toast.success("Compte créé avec succès");
        setIsSignUp(false); // Switch back to login view
      } else {
        // Login process
        try {
          await login(email, password);
          toast.success("Connexion réussie");
          navigate("/dashboard");
        } catch (error: any) {
          console.error("Erreur de connexion:", error);
          toast.error(error.message || "Échec de la connexion");
        }
      }
    } catch (error: any) {
      console.error("Erreur d'authentification:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 bg-primary p-2 text-primary-foreground text-center text-sm z-50">
          <div className="container flex items-center justify-between">
            <p>
              Vous êtes connecté en tant que <strong>{originalUser?.name}</strong> (mode administrateur)
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={stopImpersonating}
              className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary"
            >
              Revenir à mon compte
            </Button>
          </div>
        </div>
      )}

      <AnimatedContainer direction="up" className="w-full max-w-md">
        <Card className="glass-panel shadow-lg border-white/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              {isSignUp ? "Créer un compte" : "Connexion"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Entrez vos informations pour créer un compte" 
                : "Entrez vos identifiants pour accéder à votre compte"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    required={isSignUp}
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              )}
              
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
                  {!isSignUp && (
                    <Button variant="link" className="p-0 h-auto text-xs" type="button" disabled={isLoading}>
                      Mot de passe oublié ?
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
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
                    {isSignUp ? "Création en cours..." : "Connexion en cours..."}
                  </div>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Créer un compte
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Se connecter
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou
                </span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={toggleSignUp} disabled={isLoading}>
              {isSignUp ? (
                <>Déjà un compte ? Se connecter</>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un nouveau compte
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              En vous connectant, vous acceptez nos{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Conditions d'utilisation
              </a>{" "}
              et notre{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Politique de confidentialité
              </a>
            </p>
          </CardFooter>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default Login;
