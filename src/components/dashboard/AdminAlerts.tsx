
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Server } from "lucide-react";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminAlerts = () => {
  const { usersNearLimit, wordpressErrors, isLoading } = useAdminAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertes et notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Chargement des alertes...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = usersNearLimit.length > 0 || wordpressErrors.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes et notifications
          {hasAlerts && (
            <Badge variant="destructive" className="ml-2">
              {usersNearLimit.length + wordpressErrors.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAlerts ? (
          <div className="text-center py-4 text-muted-foreground">
            Aucune alerte pour le moment
          </div>
        ) : (
          <>
            {/* Utilisateurs proches de leurs limites */}
            {usersNearLimit.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Utilisateurs proches de leurs limites</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    {usersNearLimit.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {user.published_count}/{user.max_limit} publications
                          </span>
                        </div>
                        <Badge variant={user.remaining <= 2 ? "destructive" : "secondary"}>
                          {user.remaining} restantes
                        </Badge>
                      </div>
                    ))}
                    <Button asChild size="sm" className="mt-2">
                      <Link to="/users">Gérer les utilisateurs</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Configurations WordPress en erreur */}
            {wordpressErrors.length > 0 && (
              <Alert variant="destructive">
                <Server className="h-4 w-4" />
                <AlertTitle>Configurations WordPress en erreur</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    {wordpressErrors.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                        <div>
                          <span className="font-medium">{config.name}</span>
                          <span className="text-sm text-muted-foreground ml-2 block">
                            {config.site_url}
                          </span>
                          <span className="text-sm text-destructive">
                            {config.error_message}
                          </span>
                        </div>
                        <Badge variant="destructive">Erreur</Badge>
                      </div>
                    ))}
                    <Button asChild size="sm" className="mt-2">
                      <Link to="/wordpress">Gérer WordPress</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAlerts;
