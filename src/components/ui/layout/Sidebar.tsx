
"use client"

import React, { useEffect, useMemo } from "react";
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
  UserCircle,
  Monitor
} from "lucide-react";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isClient } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  // Memoize navigation items to prevent unnecessary re-renders
  const navItems = useMemo(() => {
    const items = [
      {
        name: "Mon Tableau de bord",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        isActive: pathname === "/dashboard",
      },
    ];

    // Only show announcements and create links for non-admin users
    if (!isAdmin) {
      items.push(
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
        }
      );
    }

    return items;
  }, [pathname, isAdmin]);

  const adminItems = useMemo(() => [
    {
      name: "Gestion utilisateurs",
      href: "/users",
      icon: <UserCog className="h-5 w-5" />,
      isActive: pathname === "/users",
      adminOnly: true,
    },
    {
      name: "Aperçu des sites",
      href: "/websites",
      icon: <Monitor className="h-5 w-5" />,
      isActive: pathname === "/websites",
      adminOnly: true,
    },
    {
      name: isClient ? "Mon site" : "Gestion WordPress",
      href: "/wordpress",
      icon: <Globe className="h-5 w-5" />,
      isActive: pathname === "/wordpress",
      adminOnly: false,
    },
  ], [pathname, isClient]);

  const profileItems = useMemo(() => [
    {
      name: "Mon Profil",
      href: "/profile",
      icon: <UserCircle className="h-5 w-5" />,
      isActive: pathname === "/profile",
    }
  ], [pathname]);

  if (!isAuthenticated) return null;

  const SidebarContent = React.memo(() => (
    <>
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
            alt="Digiibuz" 
            className="h-8 w-auto" 
          />
          <span className="text-lg font-bold text-white">
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
                      "w-full justify-start text-white/80 hover:bg-white/10 hover:text-white",
                      item.isActive && "bg-white/20 text-white border-r-2 border-digibuz-yellow"
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
                  <h3 className="px-3 text-xs font-semibold uppercase text-white/60 tracking-wider">
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
                            "w-full justify-start text-white/80 hover:bg-white/10 hover:text-white",
                            item.isActive && "bg-white/20 text-white border-r-2 border-digibuz-yellow"
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
        <div className="mt-auto border-t border-white/10 pt-4">
          {profileItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => isMobile && setIsOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-2 text-white/80 hover:bg-white/10 hover:text-white",
                  item.isActive && "bg-white/20 text-white border-r-2 border-digibuz-yellow"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Button>
            </Link>
          ))}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.name}</p>
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
            <Button onClick={logout} variant="ghost" size="icon" aria-label="Déconnexion" className="text-white/60 hover:text-white">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  ));

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-black/20 backdrop-blur-md border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
              alt="Digiibuz" 
              className="h-7 w-auto" 
            />
            <span className="text-lg font-bold text-white">
              Digiibuz
            </span>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-black/20 backdrop-blur-xl border-white/10">
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
      <div className="h-[calc(100vh-2rem)] m-4 bg-black/20 backdrop-blur-xl rounded-r-2xl border border-white/10">
        <SidebarContent />
      </div>
    </aside>
  );
};

export default Sidebar;
