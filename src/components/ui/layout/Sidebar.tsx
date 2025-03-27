
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Archive,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  adminOnly?: boolean;
}

const SidebarItem = ({ 
  to, 
  icon, 
  label, 
  active = false,
  adminOnly = false
}: SidebarItemProps) => {
  const { isAdmin } = useAuth();
  
  if (adminOnly && !isAdmin) return null;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent transition-colors duration-200",
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
          : "text-sidebar-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar hidden md:block">
      <div className="flex flex-col h-full p-4">
        <div className="space-y-1">
          <SidebarItem
            to="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
          />
          <SidebarItem
            to="/announcements"
            icon={<FileText size={18} />}
            label="Announcements"
            active={location.pathname === "/announcements"}
          />
          <SidebarItem
            to="/create"
            icon={<PlusCircle size={18} />}
            label="Create New"
            active={location.pathname === "/create"}
          />
          <SidebarItem
            to="/archived"
            icon={<Archive size={18} />}
            label="Archived"
            active={location.pathname === "/archived"}
          />
          <SidebarItem
            to="/users"
            icon={<Users size={18} />}
            label="User Management"
            active={location.pathname === "/users"}
            adminOnly
          />
        </div>

        <div className="mt-auto">
          <SidebarItem
            to="/settings"
            icon={<Settings size={18} />}
            label="Settings"
            active={location.pathname === "/settings"}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
