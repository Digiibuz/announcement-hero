
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";

const SimpleContentGenerator = () => {
  const { isAdmin, isClient } = useAuth();
  
  const hasAccess = isAdmin || isClient;
  
  if (!hasAccess) {
    return (
      <PageLayout title="Générateur de contenu simple">
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Vous n'avez pas accès à cette fonctionnalité</span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Générateur de contenu simple"
      description="Créez du contenu SEO pour votre site web"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p>Contenu en développement. Disponible bientôt!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SimpleContentGenerator;
