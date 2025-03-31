
import { useState, useEffect } from "react";
import { Home, Plus, Newspaper, Settings, Users, Database, PanelTop, User } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar as SidebarComponent } from "../sidebar";
import { SidebarGroup } from "../sidebar/sidebar-group";
import { SidebarMenu } from "../sidebar/sidebar-menu";
import { SidebarMenuSub } from "../sidebar/sidebar-menu-sub";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Sidebar = () => {
  const location = useLocation();
  const { user, isAdmin, isClient } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(location.pathname);

  // Mise à jour du path actuel lorsque la location change
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Fonction pour déterminer si un menu est actif en fonction du chemin
  const isActive = (path: string) => currentPath === path;
  const isActiveStartsWith = (path: string) => currentPath.startsWith(path);

  return (
    <SidebarComponent>
      <div className="flex flex-col h-full px-3 py-4">
        <div className="mb-6 flex flex-col items-center">
          <Avatar className="h-12 w-12 mb-2">
            {user?.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user?.email || ""} />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-sm font-semibold">{user?.email}</div>
        </div>

        <SidebarGroup>
          <SidebarMenu>
            <Link to="/dashboard" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              <span>Tableau de bord</span>
            </Link>
          </SidebarMenu>

          <SidebarMenu>
            <Link to="/announcements" className="flex items-center">
              <Newspaper className="h-4 w-4 mr-2" />
              <span>Annonces</span>
            </Link>
            <SidebarMenuSub>
              <Link to="/announcements" className={`pl-5 py-2 pr-3 rounded-md text-sm ${isActive("/announcements") ? "bg-muted" : "hover:bg-muted/50"}`}>
                Toutes les annonces
              </Link>
              <Link to="/create" className={`pl-5 py-2 pr-3 rounded-md text-sm ${isActive("/create") ? "bg-muted" : "hover:bg-muted/50"}`}>
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Créer une annonce</span>
                </div>
              </Link>
            </SidebarMenuSub>
          </SidebarMenu>

          {/* Menu pour DiviPixel */}
          <SidebarMenu>
            <Link to="/divipixel-pages" className="flex items-center">
              <PanelTop className="h-4 w-4 mr-2" />
              <span>Pages DiviPixel</span>
            </Link>
            <SidebarMenuSub>
              <Link to="/divipixel-pages" className={`pl-5 py-2 pr-3 rounded-md text-sm ${isActive("/divipixel-pages") ? "bg-muted" : "hover:bg-muted/50"}`}>
                Toutes les pages
              </Link>
              <Link to="/create-divipixel" className={`pl-5 py-2 pr-3 rounded-md text-sm ${isActive("/create-divipixel") ? "bg-muted" : "hover:bg-muted/50"}`}>
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Créer une page</span>
                </div>
              </Link>
            </SidebarMenuSub>
          </SidebarMenu>

          {(isAdmin || isClient) && (
            <>
              <SidebarMenu>
                <Link to="/users" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Utilisateurs</span>
                </Link>
              </SidebarMenu>

              <SidebarMenu>
                <Link to="/wordpress" className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  <span>WordPress</span>
                </Link>
              </SidebarMenu>
            </>
          )}
        </SidebarGroup>
      </div>
    </SidebarComponent>
  );
};

export default Sidebar;
