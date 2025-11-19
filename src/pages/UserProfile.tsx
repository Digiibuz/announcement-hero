
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Globe, KeyRound, Lock, Eye, EyeOff, Info, CheckCircle, RefreshCw, Facebook } from "lucide-react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Badge } from "@/components/ui/badge";
import FacebookConnectionTab from "@/components/users/FacebookConnectionTab";
import DeleteAccountDialog from "@/components/users/DeleteAccountDialog";

// Schema de validation pour le changement de mot de passe
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

type PasswordForm = z.infer<typeof passwordSchema>;

const UserProfile = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { getVersion, getBuildDate, checkForUpdates } = useServiceWorker();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Rediriger vers le dashboard si pas d'utilisateur (mais pas pendant le chargement)
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate("/dashboard");
    }
  }, [user, navigate, isLoading]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await checkForUpdates();
      toast.success("Vérification des mises à jour effectuée");
    } catch (error) {
      console.error("Error checking for updates:", error);
      toast.error("Erreur lors de la vérification des mises à jour");
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Un email de réinitialisation de mot de passe a été envoyé à votre adresse email");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erreur lors de l'envoi de l'email de réinitialisation");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    setIsChangingPassword(true);
    
    try {
      // Vérifier d'abord le mot de passe actuel en tentant de se reconnecter
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword
      });

      if (signInError) {
        toast.error("Le mot de passe actuel est incorrect");
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Votre mot de passe a été modifié avec succès");
      form.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <PageLayout title="Mon Profil">
      <div className="max-w-3xl mx-auto space-y-6">
        <AnimatedContainer delay={100}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Nom</Label>
                  <div id="name" className="text-lg font-medium">
                    {user.name}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <div id="email" className="text-lg font-medium">
                    {user.email}
                  </div>
                </div>
                {user.wordpressConfig && (
                  <div className="grid gap-3">
                    <Label htmlFor="wordpress-site" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Site WordPress
                    </Label>
                    <div id="wordpress-site" className="text-lg font-medium">
                      <a 
                        href={user.wordpressConfig.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {user.wordpressConfig.name} - {user.wordpressConfig.site_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={150}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Info className="h-6 w-6" />
                Informations de l'application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Version de l'application</Label>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    v{getVersion()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Date de build</Label>
                  <span className="text-sm text-muted-foreground">{getBuildDate()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mises à jour</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">Manuelles</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCheckUpdates}
                      disabled={isCheckingUpdates}
                      className="h-8 px-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {user.canPublishSocialMedia && (
          <AnimatedContainer delay={175}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Facebook className="h-6 w-6" />
                  Connexion Facebook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FacebookConnectionTab />
              </CardContent>
            </Card>
          </AnimatedContainer>
        )}

        <AnimatedContainer delay={200}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Lock className="h-6 w-6" />
                Changer le mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPasswords.current ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={isChangingPassword}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => togglePasswordVisibility('current')}
                              disabled={isChangingPassword}
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPasswords.new ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={isChangingPassword}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => togglePasswordVisibility('new')}
                              disabled={isChangingPassword}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPasswords.confirm ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={isChangingPassword}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => togglePasswordVisibility('confirm')}
                              disabled={isChangingPassword}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isChangingPassword || isResettingPassword}
                    >
                      {isChangingPassword ? "Modification en cours..." : "Changer le mot de passe"}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={handleResetPassword}
                      disabled={isChangingPassword || isResettingPassword}
                      className="text-sm text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                    >
                      {isResettingPassword ? "Envoi en cours..." : "Mot de passe oublié ? Recevoir un email de réinitialisation"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={300}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">Autres actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" onClick={handleLogout}>
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={350}>
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold text-destructive">Zone dangereuse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La suppression de votre compte est définitive et irréversible. 
                  Toutes vos données seront définitivement supprimées.
                </p>
                <DeleteAccountDialog 
                  userEmail={user.email}
                  onDeleted={() => navigate("/login")}
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </PageLayout>
  );
};

export default UserProfile;
