
import React, { useState, useEffect } from "react";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useUserManagement } from "@/hooks/useUserManagement";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Globe, XCircle } from "lucide-react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import ClientDetailDialog from "../websites/ClientDetailDialog";
import { WordPressConfig } from "@/types/wordpress";

const DisconnectedSitesTable = () => {
  const { configs, isLoading } = useWordPressConfigs();
  const { users } = useUserManagement();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [disconnectedConfigs, setDisconnectedConfigs] = useState<WordPressConfig[]>([]);

  // Get connection status for a site (must match useAdminAlerts logic)
  const getConnectionStatus = (config: WordPressConfig) => {
    if (config.app_username && config.app_password) {
      return { 
        status: "connected", 
        label: "Connecté",
        reason: ""
      };
    } else if (config.rest_api_key) {
      return { 
        status: "partial", 
        label: "Partiel",
        reason: "Seule la clé API REST est configurée"
      };
    }

    // Determine the specific reason for disconnection
    let reason = "Configuration incomplète";
    if (!config.site_url) {
      reason = "URL du site manquante";
    } else if (!config.app_username && !config.app_password && !config.rest_api_key) {
      reason = "Aucun identifiant configuré";
    } else if (config.app_username && !config.app_password) {
      reason = "Mot de passe d'application manquant";
    } else if (!config.app_username && config.app_password) {
      reason = "Nom d'utilisateur d'application manquant";
    }

    return { 
      status: "disconnected", 
      label: "Déconnecté",
      reason: reason
    };
  };

  // Get client for a WordPress config
  const getClientForConfig = (configId: string) => {
    return users.find(user => user.wordpressConfigId === configId && user.role === 'client');
  };

  // Filter disconnected and partially connected configs
  useEffect(() => {
    const disconnected = configs.filter(config => {
      const status = getConnectionStatus(config);
      return status.status === "disconnected" || status.status === "partial";
    });
    setDisconnectedConfigs(disconnected);
  }, [configs]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sites WordPress déconnectés
            {disconnectedConfigs.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {disconnectedConfigs.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site web</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut de connexion</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disconnectedConfigs.map((config) => {
                const client = getClientForConfig(config.id);

                return (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.site_url}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client ? (
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {client.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getConnectionStatus(config).status === "partial" ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit border-yellow-500 text-yellow-600 dark:text-yellow-500">
                          <XCircle className="h-3 w-3" />
                          Partiel
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Déconnecté
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedClient(client?.id || null)}
                            disabled={!client}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Consulter la fiche client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {disconnectedConfigs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Tous les sites sont connectés
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <ClientDetailDialog
          clientId={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
        />
      )}
    </>
  );
};

export default DisconnectedSitesTable;
