
import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/sidebar/sidebar-structure";
import { Home, Plus, Newspaper, Settings, Users, Database, PanelTop } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar as SidebarComponent } from "../sidebar";
import { SidebarGroup } from "../sidebar/sidebar-group";
import { SidebarMenu } from "../sidebar/sidebar-menu";
import { SidebarMenuSub } from "../sidebar/sidebar-menu-sub";
import Avatar from "../Avatar";

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
          <Avatar user={user} className="h-12 w-12 mb-2" />
          <div className="text-sm font-semibold">{user?.email}</div>
        </div>

        <SidebarGroup>
          <SidebarMenu active={isActive("/dashboard")}>
            <Link to="/dashboard" className="flex items-center">
              <Icon Icon={Home} />
              <span>Tableau de bord</span>
            </Link>
          </SidebarMenu>

          <SidebarMenu active={isActiveStartsWith("/announcements") || isActive("/create")}>
            <Link to="/announcements" className="flex items-center">
              <Icon Icon={Newspaper} />
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

          {/* Nouveau menu pour DiviPixel */}
          <SidebarMenu active={isActiveStartsWith("/divipixel-pages") || isActive("/create-divipixel")}>
            <Link to="/divipixel-pages" className="flex items-center">
              <Icon Icon={PanelTop} />
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
              <SidebarMenu active={isActive("/users")}>
                <Link to="/users" className="flex items-center">
                  <Icon Icon={Users} />
                  <span>Utilisateurs</span>
                </Link>
              </SidebarMenu>

              <SidebarMenu active={isActive("/wordpress")}>
                <Link to="/wordpress" className="flex items-center">
                  <Icon Icon={Database} />
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
