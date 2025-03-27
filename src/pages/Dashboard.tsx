
import React from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import WordPressInfo from "@/components/wordpress/WordPressInfo";
import { BarChart2, FileText, Plus, Users, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <h1 className="text-3xl font-semibold mb-2">Tableau de bord</h1>
            <p className="text-muted-foreground mb-8">
              Bienvenue, {user?.name}
            </p>

            {/* Section d'info WordPress pour les éditeurs */}
            <div className="mb-8">
              <WordPressInfo />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="Créer une annonce"
                icon={<Plus className="h-6 w-6" />}
                onClick={() => handleCardClick("/create")}
              />
              <DashboardCard
                title="Mes annonces"
                icon={<FileText className="h-6 w-6" />}
                onClick={() => handleCardClick("/announcements")}
              />
              {isAdmin && (
                <>
                  <DashboardCard
                    title="Utilisateurs"
                    icon={<Users className="h-6 w-6" />}
                    onClick={() => handleCardClick("/users")}
                  />
                  <DashboardCard
                    title="Sites WordPress"
                    icon={<Globe className="h-6 w-6" />}
                    onClick={() => handleCardClick("/wordpress")}
                  />
                  <DashboardCard
                    title="Statistiques"
                    icon={<BarChart2 className="h-6 w-6" />}
                    disabled
                    disabledMessage="Bientôt disponible"
                  />
                </>
              )}
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
