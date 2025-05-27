
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

const Templates = () => {
  return (
    <PageLayout title="Modèles">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Modèles d'annonces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Les modèles d'annonces seront bientôt disponibles pour vous aider à créer rapidement de belles annonces.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Templates;
