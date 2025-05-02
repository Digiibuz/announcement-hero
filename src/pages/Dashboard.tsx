import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { 
  FileText, 
  Clock,
  ChevronRight,
  Calendar,
  Plus,
  Users,
  TicketCheck,
  Server
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Announcement } from "@/types/announcement";
import { Button } from "@/components/ui/button";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useTickets, useAllTickets } from "@/hooks/tickets";

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  // Client stats - announcements
  const { data: announcementStats, isLoading: isLoadingAnnouncementStats } = useQuery({
    queryKey: ["announcements-stats"],
    queryFn: async () => {
      const query = supabase.from("announcements").select("*");
      
      if (!isAdmin && user?.id) {
        const { data, error } = await query.filter('user_id', 'eq', user.id);
        
        if (error) {
          console.error("Error fetching announcements stats:", error);
          return {
            published: 0,
            scheduled: 0,
            draft: 0,
            total: 0
          };
        }
        
        const published = data.filter(a => a.status === "published").length;
        const scheduled = data.filter(a => a.status === "scheduled").length;
        const draft = data.filter(a => a.status === "draft").length;
        
        return {
          published,
          scheduled,
          draft,
          total: data.length
        };
      } else {
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching announcements stats:", error);
          return {
            published: 0,
            scheduled: 0,
            draft: 0,
            total: 0
          };
        }
        
        const published = data.filter(a => a.status === "published").length;
        const scheduled = data.filter(a => a.status === "scheduled").length;
        const draft = data.filter(a => a.status === "draft").length;
        
        return {
          published,
          scheduled,
          draft,
          total: data.length
        };
      }
    },
    enabled: !!user,
  });

  // Admin stats - users
  const { data: usersCount, isLoading: isLoadingUsersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });
      
      if (error) {
        console.error("Error fetching users count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && isAdmin,
  });

  // Admin stats - wordpress configs
  const { data: wordpressCount, isLoading: isLoadingWordpressCount } = useQuery({
    queryKey: ["wordpress-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("wordpress_configs")
        .select("*", { count: 'exact', head: true });
      
      if (error) {
        console.error("Error fetching wordpress count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && isAdmin,
  });

  // Admin stats - support tickets
  const { data: allTickets = [] } = useAllTickets();
  const ticketStats = React.useMemo(() => {
    const openTickets = allTickets.filter(t => t.status === "open").length;
    const inProgressTickets = allTickets.filter(t => t.status === "in_progress").length;
    const closedTickets = allTickets.filter(t => t.status === "closed").length;
    
    return {
      open: openTickets,
      inProgress: inProgressTickets,
      closed: closedTickets,
      total: allTickets.length
    };
  }, [allTickets]);

  // Recent announcements - common for both roles
  const { data: recentAnnouncements, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["recent-announcements"],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (!isAdmin && user?.id) {
        query = query.filter('user_id', 'eq', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching recent announcements:", error);
        return [];
      }
      
      return data.map(announcement => {
        const processed: Announcement = { ...announcement } as Announcement;
        
        if (processed.description) {
          processed.description = stripHtmlTags(processed.description);
        }
        
        return processed;
      });
    },
    enabled: !!user,
  });

  // Recent tickets for admin
  const { data: recentTickets, isLoading: isLoadingRecentTickets } = useQuery({
    queryKey: ["recent-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent tickets:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Client-specific data - upcoming announcements
  const { data: upcomingAnnouncements, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["upcoming-announcements"],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from("announcements")
        .select("*")
        .filter('status', 'eq', 'scheduled')
        .filter('publish_date', 'gt', now)
        .order("publish_date", { ascending: true })
        .limit(3);
      
      if (!isAdmin && user?.id) {
        query = query.filter('user_id', 'eq', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching upcoming announcements:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!user && !isAdmin,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "in_progress":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <PageLayout title="Mon Tableau de bord">
      <AnimatedContainer delay={100} className="mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <p className="text-muted-foreground dark:text-gray-300">
            Bienvenue, {user?.name}
          </p>
          <Button asChild className="mt-2 sm:mt-0 bg-digibuz-yellow text-digibuz-navy hover:bg-digibuz-yellow/90">
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer une annonce
            </Link>
          </Button>
        </div>
      </AnimatedContainer>

      <AnimatedContainer delay={200}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isAdmin ? (
            // Admin dashboard cards
            <>
              <DashboardCard
                title="Utilisateurs"
                icon={<Users size={20} className="dark:text-gray-200" />}
                value={isLoadingUsersCount ? "..." : usersCount || 0}
                description="Comptes utilisateurs"
                to="/users"
                className="card-shadow"
              />
              <DashboardCard
                title="WordPress"
                icon={<Server size={20} className="dark:text-gray-200" />}
                value={isLoadingWordpressCount ? "..." : wordpressCount || 0}
                description="Configurations WordPress"
                to="/wordpress"
                className="card-shadow"
              />
              <DashboardCard
                title="Tickets Support"
                icon={<TicketCheck size={20} className="dark:text-gray-200" />}
                value={isLoadingRecentTickets ? "..." : ticketStats.total}
                description={`${ticketStats.open} ouvert${ticketStats.open > 1 ? 's' : ''}`}
                to="/support"
                className="card-shadow"
              />
              <DashboardCard
                title="Annonces"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={isLoadingAnnouncementStats ? "..." : announcementStats?.total || 0}
                description="Toutes plateformes"
                to="/announcements"
                className="card-shadow"
              />
            </>
          ) : (
            // Client dashboard cards
            <>
              <DashboardCard
                title="Publiées"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={isLoadingAnnouncementStats ? "..." : announcementStats?.published || 0}
                description="Annonces actives"
                to="/announcements?status=published"
                className="card-shadow"
              />
              <DashboardCard
                title="Programmées"
                icon={<Clock size={20} className="dark:text-gray-200" />}
                value={isLoadingAnnouncementStats ? "..." : announcementStats?.scheduled || 0}
                description="Publications à venir"
                to="/announcements?status=scheduled"
                className="card-shadow"
              />
              <DashboardCard
                title="Brouillons"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={isLoadingAnnouncementStats ? "..." : announcementStats?.draft || 0}
                description="En cours de rédaction"
                to="/announcements?status=draft"
                className="card-shadow"
              />
              <DashboardCard
                title="Total"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={isLoadingAnnouncementStats ? "..." : announcementStats?.total || 0}
                description="Toutes les annonces"
                to="/announcements"
                className="card-shadow"
              />
            </>
          )}
        </div>
      </AnimatedContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnimatedContainer delay={300} className="lg:col-span-2">
          <Card className="h-full card-shadow">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-medium">
                Dernières Annonces
              </CardTitle>
              <Link 
                to="/announcements" 
                className="text-sm text-primary dark:text-blue-300 hover:underline flex items-center"
              >
                Voir toutes
                <ChevronRight size={16} />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingRecent ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAnnouncements && recentAnnouncements.length > 0 ? (
                    recentAnnouncements.map((announcement) => (
                      <Link 
                        to={`/announcements/${announcement.id}`}
                        key={announcement.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors block"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0">
                            <FileText size={18} className="text-muted-foreground dark:text-gray-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{announcement.title}</div>
                            <div className="text-sm text-muted-foreground dark:text-gray-300">
                              {formatDate(announcement.created_at)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusBadgeClass(announcement.status)
                            }`}
                          >
                            {announcement.status === "published" ? "Publiée" : 
                              announcement.status === "scheduled" ? "Programmée" : "Brouillon"}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center p-6 text-muted-foreground dark:text-gray-300">
                      Aucune annonce récente. <Link to="/create" className="text-primary dark:text-blue-300">Créer une annonce</Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={400}>
          {isAdmin ? (
            // Admin side panel: Recent tickets
            <Card className="h-full card-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <TicketCheck size={18} className="mr-2 dark:text-gray-200" />
                  Derniers Tickets Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingRecentTickets ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-full max-w-[180px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {recentTickets && recentTickets.length > 0 ? (
                      recentTickets.map((ticket) => (
                        <Link
                          to={`/support?ticket=${ticket.id}`}
                          key={ticket.id}
                          className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-sm text-muted-foreground dark:text-gray-300">
                              {ticket.username}
                            </div>
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getStatusBadgeClass(ticket.status)
                              }`}
                            >
                              {ticket.status === "open" ? "Ouvert" : 
                               ticket.status === "in_progress" ? "En cours" : "Résolu"}
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground dark:text-gray-300">
                        Aucun ticket récent
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            // Client side panel: Upcoming publications
            <Card className="h-full card-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Calendar size={18} className="mr-2 dark:text-gray-200" />
                  Prochaines Publications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingUpcoming ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-full max-w-[180px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {upcomingAnnouncements && upcomingAnnouncements.length > 0 ? (
                      upcomingAnnouncements.map((announcement) => (
                        <Link
                          to={`/announcements/${announcement.id}`}
                          key={announcement.id}
                          className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{announcement.title}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-sm text-muted-foreground dark:text-gray-300 flex items-center">
                              <Clock size={14} className="mr-1 dark:text-gray-300" />
                              {announcement.publish_date ? formatDate(announcement.publish_date) : "Date non définie"}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground dark:text-gray-300">
                        Aucune publication programmée
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatedContainer>
      </div>

      <FloatingActionButton 
        position="bottom-right" 
        asChild
        showOnMobile={true}
        hideOnDesktop={true}
        className="bg-digibuz-yellow text-digibuz-navy hover:bg-digibuz-yellow/90 font-bold"
      >
        <Link to="/create">
          <Plus className="mr-2 h-4 w-4" />
          Créer
        </Link>
      </FloatingActionButton>
    </PageLayout>
  );
};

export default Dashboard;
