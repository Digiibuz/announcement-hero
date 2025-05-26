
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Globe, KeyRound } from "lucide-react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <PageLayout title="Profil">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Vous n'êtes pas connecté</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleResetPassword = async () => {
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
    }
  };

  return (
    <PageLayout title="Mon Profil">
      <div className="max-w-3xl mx-auto">
        <AnimatedContainer delay={100}>
          <Card className="mb-6">
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

        <AnimatedContainer delay={200}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleResetPassword}
                  className="flex items-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  Réinitialiser le mot de passe
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </PageLayout>
  );
};

export default UserProfile;
