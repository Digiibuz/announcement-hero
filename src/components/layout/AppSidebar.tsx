
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, LayoutDashboard, FileText, Newspaper, UserCog, Globe, Menu } from "lucide-react";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAdmin, isClient } = useAuth();

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

  if (!user) return null;

  return (
    <div className="h-screen border-r border-border bg-sidebar text-sidebar-foreground w-64 flex-shrink-0 overflow-y-auto">
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

      <div className="px-3 py-4">
        <div className="space-y-4">
          <div>
            <div className="px-4 py-2">
              <h3 className="text-xs uppercase font-medium text-muted-foreground">
                Navigation
              </h3>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                    item.isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {(isAdmin || isClient) && (
            <div>
              <div className="px-4 py-2">
                <h3 className="text-xs uppercase font-medium text-muted-foreground">
                  Administration
                </h3>
              </div>
              <nav className="space-y-1">
                {adminItems
                  .filter(item => isAdmin || (!item.adminOnly && isClient))
                  .map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                        item.isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto px-3 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button onClick={logout} variant="ghost" size="icon" aria-label="Déconnexion">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
