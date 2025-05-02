
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const TicketListEmpty: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-center py-8 text-muted-foreground">
          Vous n'avez pas encore de tickets. Créez-en un pour obtenir de l'aide.
        </p>
      </CardContent>
    </Card>
  );
};
