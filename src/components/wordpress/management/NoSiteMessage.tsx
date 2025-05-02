
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const NoSiteMessage: React.FC = () => {
  return (
    <Card className="mt-4">
      <CardContent className="p-6 text-center">
        <p className="text-muted-foreground mb-2">
          Aucun site WordPress n'est actuellement attribué à votre compte.
        </p>
        <p className="text-sm text-muted-foreground">
          Veuillez contacter votre administrateur pour obtenir un accès.
        </p>
      </CardContent>
    </Card>
  );
};

export default NoSiteMessage;
