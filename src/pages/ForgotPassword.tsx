import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DynamicBackground from "@/components/ui/DynamicBackground";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const navigate = useNavigate();

  // Décompte pour la limitation de taux
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    if (rateLimitSeconds > 0) {
      toast.error(`Veuillez attendre ${rateLimitSeconds} secondes avant de réessayer`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Utiliser toujours l'URL de production pour la redirection
      const redirectTo = "https://app.digiibuz.fr/reset-password";
      
      console.log("URL de redirection pour la réinitialisation:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (error) {
        // Gérer spécifiquement l'erreur de limitation de taux
        if (error.message.includes("For security purposes, you can only request this after")) {
          const match = error.message.match(/after (\d+) seconds/);
          const seconds = match ? parseInt(match[1]) : 60;
          setRateLimitSeconds(seconds);
          toast.error(`Trop de demandes. Veuillez attendre ${seconds} secondes.`);
          return;
        }
        throw error;
      }
      
      // Toujours afficher un message générique, même si l'email n'existe pas
      // pour des raisons de sécurité
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      // Même en cas d'erreur, on affiche un message générique
      // pour ne pas révéler si un compte existe ou non
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DynamicBackground className="min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-4">
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
              <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
              <CardDescription>
                Saisissez votre adresse email pour réinitialiser votre mot de passe
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isSubmitted ? (
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription>
                    Si un compte est associé à cette adresse, vous recevrez un email pour réinitialiser votre mot de passe.
                    Veuillez vérifier votre boîte de réception et vos spams.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {rateLimitSeconds > 0 && (
                    <Alert className="mb-4 bg-orange-50 border-orange-200">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Trop de demandes d'envoi. Veuillez attendre <strong>{rateLimitSeconds}</strong> secondes avant de réessayer.
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
                        disabled={isLoading || rateLimitSeconds > 0}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || rateLimitSeconds > 0}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </div>
                      ) : rateLimitSeconds > 0 ? (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Attendre {rateLimitSeconds}s
                        </div>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer le lien
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            </CardFooter>
          </Card>
        </AnimatedContainer>
      </div>
    </DynamicBackground>
  );
};

export default ForgotPassword;
