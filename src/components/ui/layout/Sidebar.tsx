
import React from "react";
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
  AlertTriangle, 
  Globe,
  FileText,
  Menu
} from "lucide-react";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isClient, isImpersonating, stopImpersonating, originalUser } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isAuthenticated) return null;

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

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center">
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Announcement Manager
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
              {adminItems.map((item) => (
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
    </>
  );

  // Mobile sidebar with Sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-background/90 backdrop-blur-sm border-b border-border">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Announcement Manager
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
        
        {/* Add padding for fixed header */}
        <div className="h-16" />
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-card shadow-sm transition-transform md:translate-x-0">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
