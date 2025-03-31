
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sidebar, 
  SidebarProvider,
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
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

const AppSidebar = () => {
  const location = useLocation();
  const { isAdmin, isClient } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-semibold">Admin Dashboard</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-6 p-2">
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/")}>
                    <Link to="/">
                      <Home className="h-4 w-4" />
                      <span>Accueil</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/announcements")}>
                    <Link to="/announcements">
                      <Megaphone className="h-4 w-4" />
                      <span>Annonces</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/pages")}>
                    <Link to="/pages">
                      <FileText className="h-4 w-4" />
                      <span>Pages</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/tom-e")}>
                    <Link to="/tom-e">
                      <Newspaper className="h-4 w-4" />
                      <span>Tom-E</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {(isAdmin || isClient) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/generateur-contenu")}>
                      <Link to="/generateur-contenu">
                        <Sparkles className="h-4 w-4" />
                        <span>Générateur de contenu</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/utilisateurs")}>
                      <Link to="/utilisateurs">
                        <Users className="h-4 w-4" />
                        <span>Utilisateurs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/parametres")}>
                      <Link to="/parametres">
                        <Settings className="h-4 w-4" />
                        <span>Paramètres</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </div>
        </ScrollArea>
      </Sidebar>
    </SidebarProvider>
  );
};

export default AppSidebar;
