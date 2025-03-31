
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketList from "@/components/support/TicketList";
import CreateTicketForm from "@/components/support/CreateTicketForm";
import AdminTickets from "@/components/support/AdminTickets";

const Support = () => {
  const { isAdmin, isClient } = useAuth();

  return (
    <PageLayout 
      title="Support & Assistance"
      description="Contactez notre équipe ou consultez vos tickets précédents"
    >
      <div className="max-w-5xl mx-auto">
        {isAdmin ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous les tickets</TabsTrigger>
              <TabsTrigger value="open">Tickets ouverts</TabsTrigger>
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
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="create">Nouveau ticket</TabsTrigger>
              <TabsTrigger value="previous">Mes tickets</TabsTrigger>
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
