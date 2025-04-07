
"use client"

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  UserCog, 
  LogOut, 
  LayoutDashboard, 
  Newspaper, 
  Globe,
  FileText,
  Menu,
  UserCircle,
  Ticket,
  Bell
} from "lucide-react";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import NotificationIcon from "@/components/notifications/NotificationIcon";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user, logout, isLoading, isAuthenticated, isAdmin, isClient } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const { unreadCount: ticketUnreadCount, resetTicketTabView } = useTicketNotifications();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const [localTicketUnreadCount, setLocalTicketUnreadCount] = React.useState(0);

  useEffect(() => {
    setLocalTicketUnreadCount(ticketUnreadCount);
  }, [ticketUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;

    const responsesChannel = supabase
      .channel('sidebar_ticket_responses')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_responses'
      }, () => {
        setTimeout(() => setLocalTicketUnreadCount(ticketUnreadCount), 300);
      })
      .subscribe();

    const readStatusChannel = supabase
      .channel('sidebar_ticket_read_status')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_read_status'
      }, () => {
        setTimeout(() => setLocalTicketUnreadCount(ticketUnreadCount), 300);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ticket_read_status'
      }, () => {
        setTimeout(() => setLocalTicketUnreadCount(ticketUnreadCount), 300);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(responsesChannel);
      supabase.removeChannel(readStatusChannel);
    };
  }, [user?.id, ticketUnreadCount]);

  useEffect(() => {
    if (!pathname.includes('/support')) {
      resetTicketTabView();
    }
  }, [pathname, resetTicketTabView]);

  if (!isAuthenticated) return null;

  const navItems = [
    {
      name: "Mon Tableau de bord",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Annonces",
      href: "/announcements",
      icon: <FileText className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/announcements",
    },
    {
      name: "Créer une annonce",
      href: "/create",
      icon: <Newspaper className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/create",
    },
  ];

  const adminItems = [
    {
      name: "Gestion utilisateurs",
      href: "/users",
      icon: <UserCog className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/users",
      adminOnly: true,
    },
    {
      name: isClient ? "Mon site" : "Gestion WordPress",
      href: "/wordpress",
      icon: <Globe className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/wordpress",
      adminOnly: false,
    },
  ];

  const profileItems = [
    {
      name: "Mon Profil",
      href: "/profile",
      icon: <UserCircle className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/profile",
    },
    {
      name: "Notifications",
      href: isAdmin ? "/notifications-admin" : "/notifications",
      icon: <Bell className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/notifications" || pathname === "/notifications-admin",
      badge: notificationUnreadCount > 0 ? (
        <Badge 
          variant="destructive" 
          className="ml-2 px-1.5 py-0.5 text-xs"
        >
          {notificationUnreadCount}
        </Badge>
      ) : null,
    },
    {
      name: "Support & Assistance",
      href: "/support",
      icon: <Ticket className="h-5 w-5 dark:text-gray-200" />,
      isActive: pathname === "/support",
      badge: localTicketUnreadCount > 0 ? (
        <Badge 
          variant="destructive" 
          className="ml-2 px-1.5 py-0.5 text-xs"
        >
          {localTicketUnreadCount}
        </Badge>
      ) : null,
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
            alt="Digiibuz" 
            className="h-8 w-auto" 
          />
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-digibuz-navy to-digibuz-navy/70">
            Digiibuz
          </span>
        </Link>
      </div>

      <div className={`h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 flex flex-col ${isMobile ? "" : "relative"}`}>
        <div className="flex-grow">
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
                {adminItems
                  .filter(item => isAdmin || (!item.adminOnly && isClient))
                  .map((item) => (
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
        </div>

        <div className="mt-auto border-t border-border pt-4">
          {profileItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => isMobile && setIsOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-2",
                  item.isActive && "bg-accent text-accent-foreground"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {item.badge}
              </Button>
            </Link>
          ))}
          
          <div className="flex items-center justify-between mt-2">
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-background/90 backdrop-blur-sm border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
              alt="Digiibuz" 
              className="h-7 w-auto" 
            />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-digibuz-navy to-digibuz-navy/70">
              Digiibuz
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <NotificationIcon />
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
        </div>
        
        <div className="h-16" />
      </>
    );
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-card shadow-sm transition-transform md:translate-x-0">
        <SidebarContent />
      </aside>
      
      <div className="fixed top-0 right-0 z-40 h-16 bg-background/90 backdrop-blur-sm border-b border-border flex items-center px-4">
        <div className="ml-auto">
          <NotificationIcon />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
