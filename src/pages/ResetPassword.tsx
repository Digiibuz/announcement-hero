
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Vérifier si le token est valide au chargement de la page
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Récupérer la session pour voir si l'utilisateur a un accès valide pour réinitialiser le mot de passe
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Si nous avons une session et que le type d'accès est 'recovery', le token est valide
        if (data?.session?.access_token && data.session.user) {
          setIsTokenValid(true);
        } else {
          // Sinon, le token n'est pas valide ou a expiré
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        setIsTokenValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, []);

  const onSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    
    try {
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });
      
      if (error) {
        throw error;
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
