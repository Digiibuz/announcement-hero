
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PublicationCounter from "@/components/dashboard/PublicationCounter";
import RecentAnnouncements from "@/components/dashboard/RecentAnnouncements";
import AdminAlerts from "@/components/dashboard/AdminAlerts";
import WebsiteOverviewTable from "@/components/websites/WebsiteOverviewTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Calendar, Plus, Users, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { stats, isLoading } = useDashboardStats();

  // Simple greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  return (
    <PageLayout title="Mon Tableau de bord">
      <AnimatedContainer delay={100} className="mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <p className="text-muted-foreground dark:text-gray-300">
            Bienvenue, {user?.name || user?.email || 'Utilisateur'}
          </p>
          {!isAdmin && (
            <Button asChild className="mt-2 sm:mt-0 bg-digibuz-yellow text-digibuz-navy hover:bg-digibuz-yellow/90">
              <Link to="/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer une annonce
              </Link>
            </Button>
          )}
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
                value={stats.totalUsers}
                description="Comptes utilisateurs"
                to="/users"
                className="card-shadow"
                isLoading={isLoading}
              />
              <DashboardCard
                title="WordPress"
                icon={<Server size={20} className="dark:text-gray-200" />}
                value={stats.totalWordPressConfigs}
                description="Configurations WordPress"
                to="/wordpress"
                className="card-shadow"
                isLoading={isLoading}
              />
              <DashboardCard
                title="Annonces"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={stats.totalAnnouncements}
                description="Toutes plateformes"
                to="/announcements"
                className="card-shadow"
                isLoading={isLoading}
              />
            </>
          ) : (
            // Client dashboard cards
            <>
              <DashboardCard
                title="Publiées"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={stats.publishedAnnouncements}
                description="Annonces actives"
                to="/announcements?status=published"
                className="card-shadow"
                isLoading={isLoading}
              />
              <DashboardCard
                title="Programmées"
                icon={<Clock size={20} className="dark:text-gray-200" />}
                value={stats.scheduledAnnouncements}
                description="Publications à venir"
                to="/announcements?status=scheduled"
                className="card-shadow"
                isLoading={isLoading}
              />
              <DashboardCard
                title="Brouillons"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={stats.draftAnnouncements}
                description="En cours de rédaction"
                to="/announcements?status=draft"
                className="card-shadow"
                isLoading={isLoading}
              />
              <DashboardCard
                title="Total"
                icon={<FileText size={20} className="dark:text-gray-200" />}
                value={stats.totalAnnouncements}
                description="Toutes les annonces"
                to="/announcements"
                className="card-shadow"
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </AnimatedContainer>

      {/* Admin Alerts Section */}
      {isAdmin && (
        <AnimatedContainer delay={250}>
          <AdminAlerts />
        </AnimatedContainer>
      )}

      {/* Website Overview Table for admins */}
      {isAdmin && (
        <AnimatedContainer delay={300} className="mt-8">
          <WebsiteOverviewTable />
        </AnimatedContainer>
      )}

      {/* Publication Counter for non-admin users */}
      {!isAdmin && (
        <AnimatedContainer delay={250}>
          <PublicationCounter className="mb-8" />
        </AnimatedContainer>
      )}

      {/* Only show these sections for non-admin users */}
      {!isAdmin && (
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
                </Link>
              </CardHeader>
              <CardContent>
                <RecentAnnouncements />
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={400}>
            <Card className="h-full card-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Calendar size={18} className="mr-2 dark:text-gray-200" />
                  Prochaines Publications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 text-muted-foreground dark:text-gray-300">
                  Aucune publication programmée
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      )}

      {!isAdmin && (
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
      )}
    </PageLayout>
  );
};

export default Dashboard;
