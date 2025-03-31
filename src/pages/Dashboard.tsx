import React, { useEffect } from "react";
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
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Announcement } from "@/types/announcement";
import { Button } from "@/components/ui/button";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { toast } from "sonner";

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="text-lg font-medium text-red-800 mb-2">Une erreur est survenue</h3>
    <p className="text-sm text-red-600 mb-4">{error.message}</p>
    <Button 
      onClick={resetErrorBoundary}
      variant="outline"
      className="text-sm"
    >
      Réessayer
    </Button>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard tab became visible, checking for module loading errors');
        const hasLoadingError = sessionStorage.getItem('module_loading_error');
        if (hasLoadingError) {
          console.log('Previous module loading error detected, refreshing page');
          sessionStorage.removeItem('module_loading_error');
          window.location.reload();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const { data: statsData, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ["announcements-stats"],
    queryFn: async () => {
      try {
        const query = supabase.from("announcements").select("*");
        
        if (!isAdmin && user?.id) {
          const { data, error } = await query.filter('user_id', 'eq', user.id);
          
          if (error) {
            console.error("Error fetching announcements stats:", error);
            toast.error("Erreur lors du chargement des statistiques");
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
            toast.error("Erreur lors du chargement des statistiques");
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
      } catch (err) {
        console.error("Error in stats query:", err);
        toast.error("Erreur lors du chargement des statistiques");
        return {
          published: 0,
          scheduled: 0,
          draft: 0,
          total: 0
        };
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

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
    enabled: !!user,
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
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <PageLayout title="Mon Tableau de bord">
      <AnimatedContainer delay={100} className="mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <p className="text-muted-foreground">
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
          <DashboardCard
            title="Publiées"
            icon={<FileText size={20} />}
            value={isLoadingStats ? "..." : statsData?.published || 0}
            description="Annonces actives"
            to="/announcements?status=published"
            className="card-shadow"
          />
          <DashboardCard
            title="Programmées"
            icon={<Clock size={20} />}
            value={isLoadingStats ? "..." : statsData?.scheduled || 0}
            description="Publications à venir"
            to="/announcements?status=scheduled"
            className="card-shadow"
          />
          <DashboardCard
            title="Brouillons"
            icon={<FileText size={20} />}
            value={isLoadingStats ? "..." : statsData?.draft || 0}
            description="En cours de rédaction"
            to="/announcements?status=draft"
            className="card-shadow"
          />
          <DashboardCard
            title="Total"
            icon={<FileText size={20} />}
            value={isLoadingStats ? "..." : statsData?.total || 0}
            description="Toutes les annonces"
            to="/announcements"
            className="card-shadow"
          />
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
                className="text-sm text-primary hover:underline flex items-center"
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
                            <FileText size={18} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{announcement.title}</div>
                            <div className="text-sm text-muted-foreground">
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
                    <div className="text-center p-6 text-muted-foreground">
                      Aucune annonce récente. <Link to="/create" className="text-primary">Créer une annonce</Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={400}>
          <Card className="h-full card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center">
                <Calendar size={18} className="mr-2" />
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
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock size={14} className="mr-1" />
                            {announcement.publish_date ? formatDate(announcement.publish_date) : "Date non définie"}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      Aucune publication programmée
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
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
