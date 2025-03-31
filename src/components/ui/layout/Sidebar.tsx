"use client"

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
  Ticket
} from "lucide-react";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isClient } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const { unreadCount, resetTicketTabView } = useTicketNotifications();

  useEffect(() => {
    if (!pathname.includes('/support')) {
      resetTicketTabView();
    }
  }, [pathname, resetTicketTabView]);

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

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6 border-b border-border">
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
      <div className={`h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 ${isMobile ? "" : "relative"}`}>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link to={item.href} onClick={() => isMobile && setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    item.isActive && "bg-accent text-accent-foreground"
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
                <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
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
                          "w-full justify-start",
                          item.isActive && "bg-accent text-accent-foreground"
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

        <div className={`mt-auto pt-4 ${isMobile ? "pb-4" : "absolute bottom-4 left-0 right-0"} px-3`}>
          <div className="border-t border-border pt-4">
            <Link to="/profile" onClick={() => isMobile && setIsOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-2",
                  pathname === "/profile" && "bg-accent text-accent-foreground"
                )}
              >
                <UserCircle className="h-5 w-5" />
                <span className="ml-3">Mon Profil</span>
              </Button>
            </Link>
            
            <Link to="/support" onClick={() => isMobile && setIsOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-2",
                  pathname === "/support" && "bg-accent text-accent-foreground"
                )}
              >
                <Ticket className="h-5 w-5" />
                <span className="ml-3">Support & Assistance</span>
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-1.5 py-0.5 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <Button onClick={logout} variant="ghost" size="icon" aria-label="Déconnexion">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-background/90 backdrop-blur-sm border-b border-border">
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
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="h-16" />
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-card shadow-sm transition-transform md:translate-x-0">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
