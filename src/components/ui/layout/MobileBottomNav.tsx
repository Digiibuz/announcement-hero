
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Home, FileText, Plus, FolderOpen } from "lucide-react";
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
    icon: <Home className="h-5 w-5" />,
    path: "/dashboard"
  },
  {
    id: "announcements",
    label: "Projets",
    icon: <FileText className="h-5 w-5" />,
    path: "/announcements"
  },
  {
    id: "create",
    label: "",
    icon: <Plus className="h-6 w-6" />,
    path: "/create",
    isCreate: true
  },
  {
    id: "projects1",
    label: "Projets",
    icon: <FolderOpen className="h-5 w-5" />,
    path: "/announcements"
  },
  {
    id: "projects2",
    label: "Projets",
    icon: <FolderOpen className="h-5 w-5" />,
    path: "/announcements"
  }
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) return null;

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-16 w-16 rounded-full transition-all duration-200",
              item.isCreate
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg scale-110"
                : isActive(item.path)
                ? "text-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => handleNavigation(item.path)}
          >
            <div className="flex flex-col items-center gap-1">
              {item.icon}
              {!item.isCreate && (
                <span className="text-xs font-medium leading-none">
                  {item.label}
                </span>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
