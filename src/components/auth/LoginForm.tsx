
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps {
  isRetrying: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isRetrying }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      
      // Redirect after successful login
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // More descriptive error message based on error type
      if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('internet')) {
        toast.error("Problème de connexion au serveur", {
          description: "Veuillez vérifier votre connexion internet ou réessayer plus tard."
        });
      } else if (error.message?.includes('Invalid login') || error.message?.includes('mot de passe incorrect')) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.message?.includes('JSON') || error.message?.includes('communication')) {
        toast.error("Erreur de communication avec le serveur", {
          description: "Veuillez réessayer dans quelques instants."
        });
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
          disabled={isLoading || isRetrying}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs" 
            type="button" 
            disabled={isLoading || isRetrying}
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
            disabled={isLoading || isRetrying}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={togglePasswordVisibility}
            disabled={isLoading || isRetrying}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || isRetrying}>
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
  );
};
