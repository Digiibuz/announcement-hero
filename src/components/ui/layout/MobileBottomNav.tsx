
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, FolderOpen } from "lucide-react";
import AuroraButton from "@/components/ui/AuroraButton";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  isCreate?: boolean;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Accueil",
    icon: <Home className="h-4 w-4" />,
    path: "/dashboard"
  },
  {
    id: "create",
    label: "",
    icon: null, // Will be handled by AuroraButton
    path: "/create",
    isCreate: true
  },
  {
    id: "projects",
    label: "Projets",
    icon: <FolderOpen className="h-4 w-4" />,
    path: "/announcements"
  }
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isAuthenticated } = useAuth();

  // Pages d'authentification où la barre ne doit pas apparaître
  const authPages = ["/login", "/forgot-password", "/reset-password"];
  
  // Don't show navigation if not mobile, not authenticated, on public pages, or on create page
  if (!isMobile || !isAuthenticated || location.pathname === "/create" || authPages.includes(location.pathname)) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 ios-safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          if (item.isCreate) {
            return (
              <AuroraButton
                key={item.id}
                onClick={() => handleNavigation(item.path)}
              />
            );
          }

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-12 w-12 rounded-lg transition-all duration-200",
                isActive(item.path)
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="flex flex-col items-center gap-0.5">
                {item.icon}
                <span className="text-xs font-medium leading-none">
                  {item.label}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
