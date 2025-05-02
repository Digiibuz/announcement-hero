
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { Moon, Sun, User } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

const UserProfile = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  if (!userProfile) {
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
                    {userProfile.name}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <div id="email" className="text-lg font-medium">
                    {userProfile.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={200}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">Préférences d'affichage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-toggle">Mode sombre</Label>
                  <Toggle
                    id="theme-toggle"
                    variant="outline"
                    pressed={theme === 'dark'}
                    onPressedChange={toggleTheme}
                    aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span className="ml-2">
                      {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                    </span>
                  </Toggle>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={300}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </PageLayout>
  );
};

export default UserProfile;
