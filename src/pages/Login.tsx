
import React, { useState } from "react";
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // La redirection sera gérée automatiquement via le hook useAuth
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Une erreur est survenue lors de la connexion";
      
      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou mot de passe incorrect";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Veuillez confirmer votre adresse email avant de vous connecter";
        }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <AnimatedContainer className="w-full max-w-md space-y-8" delay={100}>
        <Card className="w-full">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à votre espace personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Pour obtenir un accès, veuillez contacter l'administrateur
            </p>
          </CardFooter>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default Login;
