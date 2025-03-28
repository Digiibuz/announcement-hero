
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { 
  FileText, 
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Announcement } from "@/types/announcement";

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  // Fetch announcements stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["announcements-stats"],
    queryFn: async () => {
      // Get all announcements to calculate statistics
      const query = supabase.from("announcements").select("*");
      
      // If not admin, only query user's own announcements
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
        
        // Calculate statistics
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
        
        // Calculate statistics
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

  // Fetch recent announcements
  const { data: recentAnnouncements, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["recent-announcements"],
    queryFn: async () => {
      // Start with a base query for recent announcements
      let query = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      
      // If not admin, only query user's own announcements
      if (!isAdmin && user?.id) {
        query = query.filter('user_id', 'eq', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching recent announcements:", error);
        return [];
      }
      
      // Process announcements for display
      return data.map(announcement => {
        // Create a new object with all properties from announcement
        const processed: Announcement = { ...announcement } as Announcement;
        
        // Strip HTML tags from description
        if (processed.description) {
          processed.description = stripHtmlTags(processed.description);
        }
        
        return processed;
      });
    },
    enabled: !!user,
  });

  // Fetch upcoming scheduled announcements
  const { data: upcomingAnnouncements, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["upcoming-announcements"],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Start with a base query for scheduled announcements after current date
      let query = supabase
        .from("announcements")
        .select("*")
        .filter('status', 'eq', 'scheduled')
        .filter('publish_date', 'gt', now)
        .order("publish_date", { ascending: true })
        .limit(3);
      
      // If not admin, only query user's own announcements
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

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Get the status badge styling
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
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer delay={100}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 sm:mb-0">Dashboard</h1>
              <p className="text-muted-foreground">
                Bienvenue, {user?.name}
              </p>
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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
