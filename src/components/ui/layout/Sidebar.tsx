
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, MessageSquare, FileText, GripHorizontal, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed top-0 left-0 w-64 h-full pt-16 hidden md:block border-r border-border bg-background z-10">
      <div className="py-4">
        <nav className="mt-2 px-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => cn(
              "flex items-center px-4 py-2.5 text-base transition-all rounded-md group mb-1",
              isActive 
                ? "text-primary-foreground bg-primary font-medium" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span>Tableau de bord</span>
          </NavLink>

          <div className="mt-4">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider">CONTENU</p>
            <NavLink
              to="/announcements"
              className={({ isActive }) => cn(
                "flex items-center px-4 py-2.5 text-base transition-all rounded-md group mb-1",
                isActive 
                  ? "text-primary-foreground bg-primary font-medium" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Annonces</span>
            </NavLink>
            
            <NavLink
              to="/divipixel-publications"
              className={({ isActive }) => cn(
                "flex items-center px-4 py-2.5 text-base transition-all rounded-md group mb-1",
                isActive 
                  ? "text-primary-foreground bg-primary font-medium" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Publications Divipixel</span>
            </NavLink>
          </div>

          {isAdmin && (
            <div className="mt-4">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider">ADMINISTRATION</p>
              <NavLink
                to="/users"
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-2.5 text-base transition-all rounded-md group mb-1",
                  isActive 
                    ? "text-primary-foreground bg-primary font-medium" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <Users className="w-5 h-5 mr-3" />
                <span>Gestion utilisateurs</span>
              </NavLink>

              <NavLink
                to="/wordpress"
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-2.5 text-base transition-all rounded-md group mb-1",
                  isActive 
                    ? "text-primary-foreground bg-primary font-medium" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <Globe className="w-5 h-5 mr-3" />
                <span>Gestion WordPress</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
