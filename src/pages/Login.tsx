
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setAuthError(null);
      const result = await login(data.email, data.password);
      if (result.error) {
        setAuthError(result.error.message);
        toast.error(result.error.message || "Échec de la connexion");
        return;
      }
      toast.success("Connexion réussie");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message);
      toast.error("Échec de la connexion");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <AnimatedContainer 
        className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 border border-border"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
              alt="Digiibuz" 
              className="h-12 w-auto" 
            />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-digibuz-navy to-digibuz-navy/70">
            Digiibuz
          </h1>
          <p className="text-muted-foreground mt-2">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {authError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded border border-destructive/20">
              {authError}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Adresse e-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@domaine.com"
              {...register("email", { 
                required: "L'adresse e-mail est requise",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Adresse e-mail invalide"
                }
              })}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password", { 
                required: "Le mot de passe est requis",
                minLength: {
                  value: 6,
                  message: "Le mot de passe doit contenir au moins 6 caractères"
                }
              })}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </AnimatedContainer>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Digiibuz. Tous droits réservés.
      </p>
    </div>
  );
};

export default Login;
