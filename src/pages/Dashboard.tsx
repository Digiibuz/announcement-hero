
import React from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { 
  FileText, 
  Clock,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  const recentAnnouncements = [
    {
      id: "1",
      title: "New Product Launch",
      date: "2023-05-15",
      status: "published",
    },
    {
      id: "2",
      title: "Upcoming Webinar",
      date: "2023-05-20",
      status: "scheduled",
    },
    {
      id: "3",
      title: "Company Update",
      date: "2023-05-10",
      status: "draft",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-0 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer delay={100}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <DashboardCard
                title="Published"
                icon={<FileText size={20} />}
                value={12}
                description="Active announcements"
                trend={{ value: 20, isPositive: true }}
                to="/announcements"
                className="card-shadow"
              />
              <DashboardCard
                title="Scheduled"
                icon={<Clock size={20} />}
                value={5}
                description="Upcoming announcements"
                trend={{ value: 10, isPositive: true }}
                to="/announcements?filter=scheduled"
                className="card-shadow"
              />
              <DashboardCard
                title="Drafts"
                icon={<FileText size={20} />}
                value={3}
                description="Work in progress"
                to="/announcements?filter=draft"
                className="card-shadow"
              />
              <DashboardCard
                title="Archived"
                icon={<FileText size={20} />}
                value={8}
                description="Inactive announcements"
                to="/archived"
                className="card-shadow"
              />
            </div>
          </AnimatedContainer>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnimatedContainer delay={300} className="lg:col-span-2">
              <Card className="h-full card-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    Recent Announcements
                  </CardTitle>
                  <Link 
                    to="/announcements" 
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    View all
                    <ChevronRight size={16} />
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAnnouncements.map((announcement) => (
                      <div 
                        key={announcement.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <FileText size={18} className="text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{announcement.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(announcement.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              announcement.status === "published"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : announcement.status === "scheduled"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>

            <AnimatedContainer delay={400}>
              <Card className="h-full card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <AlertCircle size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">SEO Optimization</h3>
                      <p className="text-sm text-muted-foreground">
                        Use the built-in SEO tools to improve your announcement visibility.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <AlertCircle size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Voice Input</h3>
                      <p className="text-sm text-muted-foreground">
                        Save time by using the voice recognition feature to dictate your announcements.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <AlertCircle size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Schedule Posts</h3>
                      <p className="text-sm text-muted-foreground">
                        Plan ahead by scheduling announcements for future publication.
                      </p>
                    </div>
                  </div>
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
