
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import MobileNav from "./MobileNav";

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Header transparent pour mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 md:bg-background/70 md:backdrop-blur-xl md:border-b md:border-border">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Menu hamburger pour mobile uniquement */}
            <div className="md:hidden">
              <MobileNav />
            </div>

            {/* Logo - centré sur mobile, à gauche sur desktop */}
            <div className="flex items-center md:flex-none absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none">
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

            {/* Bouton de connexion ou profil */}
            <div className="flex items-center gap-4">
              {!isAuthenticated ? (
                <Link to="/login">
                  <Button 
                    className="bg-digibuz-navy hover:bg-digibuz-navy/90 text-white dark:bg-digibuz-yellow dark:text-digibuz-navy dark:hover:bg-digibuz-yellow/90"
                  >
                    Se connecter
                  </Button>
                </Link>
              ) : (
                <div className="md:block hidden">
                  {/* Espace pour futur contenu desktop quand connecté */}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Header transparent pour mobile avec arrière-plan gradient */}
      <div className="fixed top-0 left-0 right-0 z-30 h-20 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm md:hidden pointer-events-none" />
    </>
  );
};

export default Header;
