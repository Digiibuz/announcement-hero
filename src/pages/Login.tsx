
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Loader2, RefreshCw } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schéma de validation pour le formulaire de connexion
const loginSchema = z.object({
  email: z.string().email("Veuillez saisir une adresse email valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clearingCache, setClearingCache] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log("Tentative de connexion avec:", values.email);
      
      // Tentative de connexion
      const result = await login(values.email, values.password);
      console.log("Résultat de connexion:", result);
      
      if (result && result.user) {
        toast.success("Connexion réussie");
        console.log("Connexion réussie pour:", result.user.email);
        
        // Redirect after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } else {
        throw new Error("Aucun utilisateur retourné après connexion");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Message d'erreur plus spécifique pour aider l'utilisateur
      let errorMsg = "Échec de la connexion";
      
      if (error.message && error.message.includes("Identifiants invalides")) {
        errorMsg = "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const clearBrowserCache = async () => {
    try {
      setClearingCache(true);
      
      // Nettoyer le localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Nettoyer le sessionStorage
      Object.keys(sessionStorage || {}).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Tenter une déconnexion globale
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignorer les erreurs de déconnexion
      }
      
      toast.success("Cache de l'authentification nettoyé");
      
      // Recharger la page après nettoyage
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Erreur lors du nettoyage du cache:", err);
      toast.error("Erreur lors du nettoyage du cache");
    } finally {
      setClearingCache(false);
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@example.com"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Mot de passe</FormLabel>
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
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {errorMessage && (
                  <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                    <p className="flex items-center">
                      <span className="mr-2">●</span>
                      {errorMessage}
                    </p>
                  </div>
                )}
                
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
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearBrowserCache} 
                  className="w-full"
                  disabled={clearingCache}
                >
                  {clearingCache ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Nettoyage en cours...
                    </div>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Nettoyer le cache d'authentification
                    </>
                  )}
                </Button>
              </form>
            </Form>
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
