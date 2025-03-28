
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, isAuthenticated } = useAuth();

  // Si l'utilisateur est authentifié, ne pas afficher le header du tout
  if (isAuthenticated) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
                alt="Digiibuz" 
                className="h-8 w-auto" 
              />
              <span className="text-xl font-bold text-digibuz-navy dark:text-digibuz-yellow">
                Digiibuz
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Se connecter</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
