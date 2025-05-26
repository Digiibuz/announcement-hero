
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Server, ExternalLink } from "lucide-react";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminAlerts = () => {
  const { usersNearLimit, disconnectedSites, disconnectedSitesCount, isLoading } = useAdminAlerts();

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

  const hasAlerts = usersNearLimit.length > 0 || disconnectedSitesCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes et notifications
          {hasAlerts && (
            <Badge variant="destructive" className="ml-2">
              {usersNearLimit.length + disconnectedSitesCount}
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
            {/* Sites déconnectés avec détails des problèmes */}
            {disconnectedSitesCount > 0 && (
              <Alert variant="destructive">
                <Server className="h-4 w-4" />
                <AlertTitle>Sites WordPress déconnectés</AlertTitle>
                <AlertDescription>
                  <div className="mt-3 space-y-3">
                    {disconnectedSites.map((site) => (
                      <div key={site.id} className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{site.name}</span>
                              {site.site_url && (
                                <a 
                                  href={site.site_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-destructive hover:text-destructive/80 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {site.site_url}
                            </div>
                            {site.client_name && (
                              <div className="text-xs text-muted-foreground mb-2">
                                Client: {site.client_name} ({site.client_email})
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs">
                                Problème: {site.disconnection_reason}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/websites">Voir tous les sites</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAlerts;
