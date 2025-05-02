
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminTicketsEmptyProps {
  isFiltered?: boolean;
}

export const AdminTicketsEmpty: React.FC<AdminTicketsEmptyProps> = ({ isFiltered = false }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-center py-8 text-muted-foreground">
          {isFiltered 
            ? "Aucun ticket ne correspond aux filtres sélectionnés."
            : "Aucun ticket trouvé."
          }
        </p>
      </CardContent>
    </Card>
  );
};
