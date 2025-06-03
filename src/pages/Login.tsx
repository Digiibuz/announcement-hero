
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, LogIn, Loader2, AlertTriangle } from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { useMaintenanceSettings } from "@/hooks/useMaintenanceSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const { isAuthenticated, login } = useAuth();
  const { isMaintenanceActive, getMaintenanceMessage } = useMaintenanceSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch maintenance message on component mount
  useEffect(() => {
    const fetchMaintenanceMessage = async () => {
      const message = await getMaintenanceMessage();
      setMaintenanceMessage(message);
    };
    fetchMaintenanceMessage();
  }, [getMaintenanceMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if maintenance mode is active and block login
    if (isMaintenanceActive) {
      toast({
        title: "Connexion impossible",
        description: "L'application est actuellement en maintenance. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Attempting login with email:", email);
      await login(email, password);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
        variant: "default",
      });
      
      // Délai plus long pour permettre aux gestionnaires de mots de passe de détecter la connexion réussie
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 300);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Échec de la connexion",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00c4cc 0%, #7b68ee 50%, #ff6b9d 100%)' }}>
      <ImpersonationBanner />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-300/20 rounded-lg rotate-45 animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-pink-300/15 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-white/15 transform rotate-12 animate-float-slow" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
        <div className="absolute bottom-20 right-10 w-36 h-36 bg-purple-300/10 rounded-full animate-pulse"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border border-white/20"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AnimatedContainer direction="up" className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden">
            {/* Header with logo */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <img 
                    src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
                    alt="DigiiBuz" 
                    className="h-12 w-auto"
                  />
                </div>
                <span className="text-2xl font-bold text-white">
                  DigiiBuz
                </span>
                <div className="mt-2 w-16 h-1 bg-yellow-400 rounded-full"></div>
              </div>
            </div>

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Connexion
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                Entrez vos identifiants pour accéder à votre compte
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {/* Message de maintenance */}
              {maintenanceMessage && (
                <Alert className="mb-6 border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {maintenanceMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Message de blocage si maintenance active */}
              {isMaintenanceActive && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">
                    L'application est actuellement en maintenance. Les connexions sont temporairement désactivées.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" id="login-form" method="POST">              
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300 text-base"
                      data-lpignore="false"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-semibold">Mot de passe</Label>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800" 
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
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300 text-base pr-12"
                      data-lpignore="false"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 rounded-xl hover:bg-gray-100"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  form="login-form"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg" 
                  disabled={isLoading || isMaintenanceActive}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connexion en cours...
                    </div>
                  ) : isMaintenanceActive ? (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Maintenance en cours
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="bg-gray-50/50 border-t border-gray-100">
              <p className="text-sm text-center text-gray-600 w-full">
                Contactez votre administrateur si vous n'avez pas de compte
              </p>
            </CardFooter>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  );
};

export default Login;
