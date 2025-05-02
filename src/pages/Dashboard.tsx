import React, { useEffect } from "react";
import { useAuth } from "@/context/auth";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAllTickets } from "@/hooks/tickets";
import { TicketListSkeleton } from "@/components/support/ticket-list";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: tickets, isLoading, isError } = useAllTickets();

  useEffect(() => {
    document.title = "Tableau de bord | Support";
  }, []);

  if (isLoading) {
    return <TicketListSkeleton />;
  }

  if (isError) {
    return <p className="text-center py-8">Erreur lors du chargement des tickets.</p>;
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
          <CardDescription>Aperçu des demandes de support</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="grid gap-4">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="border rounded-md p-4">
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    Créé le {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun ticket récent.</p>
          )}
        </CardContent>
      </Card>
    </Tabs>
  );
}

export default Dashboard;
