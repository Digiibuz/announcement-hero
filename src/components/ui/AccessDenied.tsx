
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const AccessDenied = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-medium mb-2">Accès refusé</h2>
        <p className="text-muted-foreground">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;
