
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TicketListErrorProps {
  error: Error;
  onRefresh: () => void;
}

export const TicketListError: React.FC<TicketListErrorProps> = ({ error, onRefresh }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8 text-red-500">
          <p>Erreur lors du chargement des tickets: {error.message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
