
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  titleAction?: React.ReactNode;
  onRefresh?: () => void;
}

const Header = ({ title, description, titleAction, onRefresh }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();

  // Si l'utilisateur est authentifié et qu'il y a un titre, afficher le header d'application
  if (isAuthenticated && title) {
    return (
      <div className="bg-card border-b border-border px-4 py-4 md:py-6 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh} 
                title="Rafraîchir les données"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {titleAction}
          </div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié mais qu'il n'y a pas de titre, ne pas afficher le header
  if (isAuthenticated) {
    return null;
  }

  // Pour les utilisateurs non authentifiés, afficher le header de landing page
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
              <Button 
                className="bg-digibuz-navy hover:bg-digibuz-navy/90 text-white dark:bg-digibuz-yellow dark:text-digibuz-navy dark:hover:bg-digibuz-yellow/90"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
