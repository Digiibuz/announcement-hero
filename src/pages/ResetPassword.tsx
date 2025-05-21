
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { generateRandomSuffix, saveSuffixForUser } from "@/utils/passwordUtils";

// Schema de validation pour le formulaire
const passwordSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

type PasswordForm = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Vérifier si le token est valide au chargement de la page et configuration immédiate de la session
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsChecking(true);
        
        // Obtenir tous les paramètres depuis le hash de l'URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const token = hashParams.get('access_token');
        const refresh = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Log pour debug
        console.log("URL hash params:", { 
          accessToken: !!token, 
          refreshToken: !!refresh, 
          type,
          fullHash: location.hash
        });
        
        if (token) {
          console.log("Token de récupération trouvé, configuration de la session...");
          setAccessToken(token);
          if (refresh) setRefreshToken(refresh);
          
          // Si nous avons un token dans l'URL hash, nous le configurons dans la session
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refresh || '',
          });
          
          if (error) {
            console.error("Erreur lors de la configuration de la session:", error);
            setIsTokenValid(false);
          } else {
            console.log("Session configurée avec succès:", data);
            setIsTokenValid(true);
            
            // Stocker l'email de l'utilisateur pour pouvoir enregistrer le suffixe de mot de passe
            if (data.user?.email) {
              setUserEmail(data.user.email);
            }
          }
        } else {
          // Sinon, nous vérifions si l'utilisateur a une session valide
          console.log("Pas de token dans le hash, vérification d'une session existante...");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Erreur lors de la vérification de la session:", error);
            setIsTokenValid(false);
          } else if (data?.session?.user) {
            console.log("Session utilisateur trouvée:", data.session.user);
            setIsTokenValid(true);
            
            // Stocker l'email de l'utilisateur pour pouvoir enregistrer le suffixe de mot de passe
            if (data.session.user.email) {
              setUserEmail(data.session.user.email);
            }
          } else {
            console.log("Aucune session trouvée et pas de token dans l'URL");
            setIsTokenValid(false);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        setIsTokenValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Exécuter immédiatement pour éviter tout délai
    checkSession();
    
    // Ajout d'un nettoyage pour éviter les fuites de mémoire
    return () => {
      // Nettoyage si nécessaire
    };
  }, [location]);

  const onSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    
    try {
      // Si nous avons stocké les tokens directement, on peut les utiliser pour s'assurer que la session est correcte
      if (accessToken && refreshToken) {
        console.log("Utilisation des tokens stockés pour la session avant mise à jour du mot de passe");
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
      
      // Générer un nouveau suffixe aléatoire pour le mot de passe
      const randomSuffix = generateRandomSuffix();
      const securedPassword = `${data.password}${randomSuffix}`;
      
      // Mettre à jour le mot de passe avec le suffixe
      const { error } = await supabase.auth.updateUser({ 
        password: securedPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Enregistrer le suffixe associé à l'email de l'utilisateur
      if (userEmail) {
        saveSuffixForUser(userEmail, randomSuffix);
        console.log(`Nouveau suffixe enregistré pour ${userEmail}`);
      } else {
        console.warn("Impossible d'enregistrer le suffixe: email de l'utilisateur inconnu");
      }
      
      setIsSubmitted(true);
      toast.success("Votre mot de passe a été réinitialisé avec succès");
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      toast.error(error.message || "Une erreur s'est produite lors de la réinitialisation du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  // Contenu à afficher en fonction de l'état de validation du token
  const renderContent = () => {
    if (isChecking) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (isTokenValid === false) {
      return (
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertDescription>
            Le lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande de réinitialisation.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (isSubmitted) {
      return (
        <Alert className="bg-primary/10 border-primary/20">
          <AlertDescription>
            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
          </AlertDescription>
        </Alert>
      );
    }
    
    // Afficher le formulaire si le token est valide
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réinitialisation en cours...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Réinitialiser le mot de passe
              </>
            )}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
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
              <LockKeyhole className="h-6 w-6" />
              Réinitialiser le mot de passe
            </CardTitle>
            <CardDescription>
              Créez un nouveau mot de passe pour votre compte
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {renderContent()}
          </CardContent>
          
          <CardFooter>
            {!isSubmitted && (
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            )}
          </CardFooter>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default ResetPassword;
