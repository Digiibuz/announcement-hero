import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PublicationCounter from "@/components/dashboard/PublicationCounter";
import RecentAnnouncements from "@/components/dashboard/RecentAnnouncements";
import AdminAlerts from "@/components/dashboard/AdminAlerts";
import DisconnectedSitesTable from "@/components/dashboard/DisconnectedSitesTable";
import DynamicHeader from "@/components/dashboard/DynamicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Calendar, Users, Server, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import "@/styles/dashboard.css";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { stats, isLoading } = useDashboardStats();
  const { disconnectedSitesCount, isLoading: alertsLoading } = useAdminAlerts();

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  return (
    <PageLayout containerClassName="pb-24 md:pb-8">
      {/* Dynamic Header */}
      <DynamicHeader />

      {/* Dashboard Cards */}
      <AnimatedContainer delay={400}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {isAdmin ? (
              // Admin dashboard cards
              <>
                <DashboardCard
                  title="Utilisateurs"
                  icon={<Users size={20} className="dark:text-gray-200" />}
                  value={stats.totalUsers}
                  description="Comptes utilisateurs"
                  to="/users"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="WordPress"
                  icon={<Server size={20} className="dark:text-gray-200" />}
                  value={stats.totalWordPressConfigs}
                  description="Configurations WordPress"
                  to="/wordpress"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="Annonces"
                  icon={<FileText size={20} className="dark:text-gray-200" />}
                  value={stats.totalAnnouncements}
                  description="Toutes plateformes"
                  to="/announcements"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="Sites déconnectés"
                  icon={<WifiOff size={20} className="dark:text-gray-200" />}
                  value={disconnectedSitesCount}
                  description="Sites WordPress"
                  to="/websites"
                  className="dashboard-card"
                  isLoading={alertsLoading}
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
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="Programmées"
                  icon={<Clock size={20} className="dark:text-gray-200" />}
                  value={stats.scheduledAnnouncements}
                  description="Publications à venir"
                  to="/announcements?status=scheduled"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="Brouillons"
                  icon={<FileText size={20} className="dark:text-gray-200" />}
                  value={stats.draftAnnouncements}
                  description="En cours de rédaction"
                  to="/announcements?status=draft"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
                <DashboardCard
                  title="Total"
                  icon={<FileText size={20} className="dark:text-gray-200" />}
                  value={stats.totalAnnouncements}
                  description="Toutes les annonces"
                  to="/announcements"
                  className="dashboard-card"
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        </div>
      </AnimatedContainer>

      {/* Rest of the dashboard content */}
      <div className="container mx-auto px-4">
        {/* Disconnected Sites Table for admins */}
        {isAdmin && (
          <AnimatedContainer delay={500} className="mb-12">
            <DisconnectedSitesTable />
          </AnimatedContainer>
        )}

        {/* Admin Alerts Section */}
        {isAdmin && (
          <AnimatedContainer delay={600}>
            <AdminAlerts />
          </AnimatedContainer>
        )}

        {/* Publication Counter for non-admin users */}
        {!isAdmin && (
          <AnimatedContainer delay={500}>
            <PublicationCounter className="mb-8" />
          </AnimatedContainer>
        )}

        {/* Only show these sections for non-admin users */}
        {!isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            <AnimatedContainer delay={600} className="lg:col-span-2">
              <Card className="h-full dashboard-card">
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

            <AnimatedContainer delay={700}>
              <Card className="h-full dashboard-card">
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
      </div>
    </PageLayout>
  );
};

export default Dashboard;
