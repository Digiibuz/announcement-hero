
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Toggle } from "@/components/ui/toggle";

const ImpersonationBanner = () => {
  const { originalUser, isImpersonating, stopImpersonating } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!isImpersonating || !originalUser) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary p-2 text-primary-foreground text-center text-sm z-50">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <p>
            Vous êtes connecté en tant que <strong>{originalUser?.name}</strong> (mode administrateur)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Toggle 
            variant="outline" 
            size="sm"
            pressed={theme === 'dark'}
            onPressedChange={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Toggle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={stopImpersonating}
            className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary"
          >
            Revenir à mon compte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
