
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  UserCog, 
  LogOut, 
  LayoutDashboard, 
  Newspaper, 
  AlertTriangle, 
  Globe,
  FileText
} from "lucide-react";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isImpersonating, stopImpersonating, originalUser } = useAuth();

  if (isMobile || !isAuthenticated) return null;

  const navItems = [
    {
      name: "Tableau de bord",
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
    },
    {
      name: "Gestion WordPress",
      href: "/wordpress",
      icon: <Globe className="h-5 w-5" />,
      isActive: pathname === "/wordpress",
    },
  ];

  // Determine what text to display in the sidebar header
  let headerText = "DiviAnnounce";
  
  // For editors with a WordPress site configured, show the WordPress site name
  if (!isAdmin && user?.wordpressConfig?.name) {
    headerText = user.wordpressConfig.name;
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-card shadow-sm transition-transform md:translate-x-0">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center">
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 truncate">
            {headerText}
          </span>
        </Link>
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link to={item.href}>
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

          {isAdmin && (
            <>
              <li className="pt-5">
                <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Administration
                </h3>
              </li>
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>
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

        <div className="mt-auto pt-4 absolute bottom-4 left-0 right-0 px-3">
          {isImpersonating && (
            <div className="mb-4 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-sm">
              <div className="flex items-center mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-800 dark:text-yellow-400 mr-1" />
                <p className="text-yellow-800 dark:text-yellow-400 font-medium">Mode d'emprunt d'identité</p>
              </div>
              <p className="text-yellow-700 dark:text-yellow-500 text-xs mb-2">
                Vous êtes connecté en tant que {user?.name}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-800/40"
                onClick={stopImpersonating}
              >
                Retour à {originalUser?.name}
              </Button>
            </div>
          )}

          <div className="border-t border-border pt-4">
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
    </aside>
  );
};

export default Sidebar;
