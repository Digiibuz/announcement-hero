
import React, { useState } from "react";
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
import { MoreHorizontal, Eye, Globe, CheckCircle, XCircle, Clock } from "lucide-react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import ClientDetailDialog from "./ClientDetailDialog";
import { WordPressConfig } from "@/types/wordpress";

const WebsiteOverviewTable = () => {
  const { configs, isLoading } = useWordPressConfigs();
  const { users } = useUserManagement();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Get connection status for a site (simplified for now)
  const getConnectionStatus = (config: WordPressConfig) => {
    if (config.app_username && config.app_password) {
      return { status: "connected", label: "Connecté" };
    } else if (config.rest_api_key) {
      return { status: "partial", label: "Partiel" };
    }
    return { status: "disconnected", label: "Déconnecté" };
  };

  // Get client for a WordPress config
  const getClientForConfig = (configId: string) => {
    return users.find(user => user.wordpressConfigId === configId && user.role === 'client');
  };

  // Get last publication date (placeholder for now)
  const getLastPublicationDate = () => {
    return "2024-01-15"; // Placeholder - à connecter avec les vraies données d'annonces
  };

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
            Aperçu des sites web
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site web</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut de connexion</TableHead>
                <TableHead>Dernière publication</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => {
                const connectionStatus = getConnectionStatus(config);
                const client = getClientForConfig(config.id);
                const lastPublication = getLastPublicationDate();

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
                      <Badge
                        variant={
                          connectionStatus.status === "connected"
                            ? "default"
                            : connectionStatus.status === "partial"
                            ? "secondary"
                            : "destructive"
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        {connectionStatus.status === "connected" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : connectionStatus.status === "partial" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {connectionStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lastPublication}</span>
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

          {configs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun site web configuré
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

export default WebsiteOverviewTable;
