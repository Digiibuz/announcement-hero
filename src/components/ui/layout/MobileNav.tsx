
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Home, Info, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      title: "Accueil",
      href: "/",
      icon: Home,
    },
    {
      title: "À propos",
      href: "/about",
      icon: Info,
    },
    {
      title: "Contact",
      href: "/contact", 
      icon: Phone,
    },
    {
      title: "Services",
      href: "/services",
      icon: Settings,
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-gray-800" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[400px] bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
        <div className="flex flex-col h-full">
          {/* Header du drawer */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
                alt="Digiibuz" 
                className="h-6 w-auto" 
              />
              <span className="text-lg font-bold text-digibuz-navy">
                Digiibuz
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation items */}
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/80 transition-colors duration-200"
                >
                  <item.icon className="h-5 w-5 text-digibuz-navy" />
                  <span className="text-gray-800 font-medium">{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Footer du drawer */}
          <div className="p-6 border-t border-gray-200/30">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button 
                className="w-full bg-digibuz-navy hover:bg-digibuz-navy/90 text-white"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNav;
