import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { 
  Home, 
  Users, 
  Settings, 
  Megaphone, 
  FileText, 
  LayoutDashboard,
  Newspaper,
  Sparkles
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, title, to, isActive, onClick }: SidebarItemProps) => {
  return (
    <Link to={to} onClick={onClick}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-2 font-normal",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {icon}
        <span>{title}</span>
      </Button>
    </Link>
  );
};

const SidebarMenu = {
  Item: SidebarItem,
  Section: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div className="space-y-1">
      {title && <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">{title}</div>}
      {children}
    </div>
  ),
};

const AppSidebar = () => {
  const location = useLocation();
  const { isAdmin, isClient } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar>
      <SidebarInset className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="h-6 w-6" />
          <span className="font-semibold">Admin Dashboard</span>
        </div>
      </SidebarInset>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-2">
          <SidebarMenu.Section>
            <SidebarMenu.Item
              icon={<Home className="h-4 w-4" />}
              title="Accueil"
              to="/"
              isActive={isActive("/")}
            />
            <SidebarMenu.Item
              icon={<Megaphone className="h-4 w-4" />}
              title="Annonces"
              to="/annonces"
              isActive={isActive("/annonces")}
            />
            <SidebarMenu.Item
              icon={<FileText className="h-4 w-4" />}
              title="Pages"
              to="/pages"
              isActive={isActive("/pages")}
            />
            <SidebarMenu.Item
              icon={<Newspaper className="h-4 w-4" />}
              title="Tom-E"
              to="/tom-e"
              isActive={isActive("/tom-e")}
            />
            {/* Ajouter un lien vers le générateur de contenu simple */}
            {(isAdmin || isClient) && (
              <SidebarMenu.Item
                icon={<Sparkles className="h-4 w-4" />}
                title="Générateur de contenu"
                to="/generateur-contenu"
              />
            )}
          </SidebarMenu.Section>

          {isAdmin && (
            <SidebarMenu.Section title="Administration">
              <SidebarMenu.Item
                icon={<Users className="h-4 w-4" />}
                title="Utilisateurs"
                to="/utilisateurs"
                isActive={isActive("/utilisateurs")}
              />
              <SidebarMenu.Item
                icon={<Settings className="h-4 w-4" />}
                title="Paramètres"
                to="/parametres"
                isActive={isActive("/parametres")}
              />
            </SidebarMenu.Section>
          )}
        </div>
      </ScrollArea>
    </Sidebar>
  );
};

export default AppSidebar;
