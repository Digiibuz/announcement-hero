"use client"

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  UserCog, 
  LogOut, 
  LayoutDashboard, 
  Newspaper, 
  Globe,
  FileText,
  Menu,
  UserCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isClient } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isAuthenticated) return null;

  const navItems = [
    {
      name: "Mon Tableau de bord",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Annonces",
      href: "/announcements",
      icon: <FileText className="h-5 w-5" />,
      isActive: pathname === "/announcements",
    },
    {
      name: "Créer une annonce",
      href: "/create",
      icon: <Newspaper className="h-5 w-5" />,
      isActive: pathname === "/create",
    },
  ];

  const adminItems = [
    {
      name: "Gestion utilisateurs",
      href: "/users",
      icon: <UserCog className="h-5 w-5" />,
      isActive: pathname === "/users",
      adminOnly: true,
    },
    {
      name: isClient ? "Mon site" : "Gestion WordPress",
      href: "/wordpress",
      icon: <Globe className="h-5 w-5" />,
      isActive: pathname === "/wordpress",
      adminOnly: false,
    },
  ];

  const profileItems = [
    {
      name: "Mon Profil",
      href: "/profile",
      icon: <UserCircle className="h-5 w-5" />,
      isActive: pathname === "/profile",
    }
  ];

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
            alt="Digiibuz" 
            className="h-8 w-auto" 
          />
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-digibuz-navy to-digibuz-navy/70">
            Digiibuz
          </span>
        </Link>
      </div>

      <div className={`h-[calc(100vh-8rem)] overflow-y-auto px-3 py-4 flex flex-col ${isMobile ? "" : "relative"}`}>
        {/* Main navigation items */}
        <div className="flex-grow">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link to={item.href} onClick={() => isMobile && setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-gray-700 hover:bg-gray-50",
                      item.isActive && "bg-digibuz-yellow/10 text-digibuz-navy border-r-2 border-digibuz-yellow"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Button>
                </Link>
              </li>
            ))}

            {(isAdmin || isClient) && (
              <>
                <li className="pt-5">
                  <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    Administration
                  </h3>
                </li>
                {adminItems
                  .filter(item => isAdmin || (!item.adminOnly && isClient))
                  .map((item) => (
                    <li key={item.href}>
                      <Link to={item.href} onClick={() => isMobile && setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-700 hover:bg-gray-50",
                            item.isActive && "bg-digibuz-yellow/10 text-digibuz-navy border-r-2 border-digibuz-yellow"
                          )}
                        >
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </Button>
                      </Link>
                    </li>
                  ))}
              </>
            )}
          </ul>
        </div>

        {/* Profile and logout items - always at the bottom */}
        <div className="mt-auto border-t border-gray-100 pt-4">
          {profileItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => isMobile && setIsOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-2 text-gray-700 hover:bg-gray-50",
                  item.isActive && "bg-digibuz-yellow/10 text-digibuz-navy border-r-2 border-digibuz-yellow"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Button>
            </Link>
          ))}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Button onClick={logout} variant="ghost" size="icon" aria-label="Déconnexion" className="text-gray-600 hover:text-gray-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
              alt="Digiibuz" 
              className="h-7 w-auto" 
            />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-digibuz-navy to-digibuz-navy/70">
              Digiibuz
            </span>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-white">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="h-16" />
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform md:translate-x-0">
      <div className="h-[calc(100vh-2rem)] m-4 bg-white rounded-r-2xl shadow-lg border border-gray-100/50">
        <SidebarContent />
      </div>
    </aside>
  );
};

export default Sidebar;
