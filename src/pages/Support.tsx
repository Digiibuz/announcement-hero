
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import TicketList from "@/components/support/TicketList";
import CreateTicketForm from "@/components/support/CreateTicketForm";
import AdminTickets from "@/components/support/AdminTickets";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";

const Support = () => {
  const { isAdmin, isClient } = useAuth();
  const { unreadCount, markTicketTabAsViewed, resetTicketTabView } = useTicketNotifications();

  // Réinitialiser la vue du tab quand on quitte la page
  useEffect(() => {
    return () => {
      resetTicketTabView();
    };
  }, [resetTicketTabView]);

  // Gérer le changement de tab
  const handleTabChange = (value: string) => {
    if (value === "previous" || value === "open") {
      markTicketTabAsViewed();
    }
  };

  return (
    <PageLayout 
      title="Support & Assistance"
    >
      <div className="max-w-5xl mx-auto">
        {isAdmin ? (
          <Tabs defaultValue="open" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous les tickets</TabsTrigger>
              <TabsTrigger value="open" className="relative">
                Tickets ouverts
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-1.5 py-0.5 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="closed">Tickets résolus</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <AdminTickets filter="all" />
            </TabsContent>
            <TabsContent value="open">
              <AdminTickets filter="open" />
            </TabsContent>
            <TabsContent value="closed">
              <AdminTickets filter="closed" />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="create" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="create">Nouveau ticket</TabsTrigger>
              <TabsTrigger value="previous" className="relative">
                Mes tickets
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-1.5 py-0.5 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <CreateTicketForm />
            </TabsContent>
            <TabsContent value="previous">
              <TicketList />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageLayout>
  );
};

export default Support;
