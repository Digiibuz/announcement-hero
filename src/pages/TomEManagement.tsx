
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, RefreshCw } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AccessDenied from "@/components/ui/AccessDenied";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

const TomEManagement = () => {
  const { isAdmin, isClient } = useAuth();
  const { configs, isLoading: isLoadingConfigs } = useWordPressConfigs();
  const [selectedConfigId, setSelectedConfigId] = React.useState<string>("");
  
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
  };
  
  const handleRefresh = async () => {
    toast.info("Rafraîchissement des données...");
  };
  
  const hasAccess = isAdmin || isClient;
  
  if (!hasAccess) {
    return (
      <PageLayout title="Tom-E - Générateur de contenu">
        <AccessDenied />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout 
      title="Tom-E - Générateur de contenu"
      description="Fonctionnalité temporairement indisponible"
      titleAction={
        selectedConfigId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={false}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        )
      }
    >
      <AnimatedContainer delay={200}>
        <div className="space-y-6">
          {isAdmin && configs && configs.length > 0 && (
            <div className="w-full max-w-xs">
              <Select
                value={selectedConfigId}
                onValueChange={handleConfigChange}
                disabled={isLoadingConfigs}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site WordPress" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map(config => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">Fonctionnalité temporairement indisponible</h2>
              <p className="text-muted-foreground mb-4">
                Le générateur de contenu Tom-E est en cours de maintenance. Nous travaillons à résoudre les problèmes de connexion à la base de données.
              </p>
              <p className="text-sm text-muted-foreground">
                Veuillez réessayer plus tard ou contactez l'administrateur système.
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default TomEManagement;
