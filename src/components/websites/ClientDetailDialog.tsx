
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserManagement } from "@/hooks/useUserManagement";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { User, Globe, Calendar, FileText } from "lucide-react";

interface ClientDetailDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientDetailDialog = ({ clientId, open, onOpenChange }: ClientDetailDialogProps) => {
  const { users, isLoading } = useUserManagement();
  
  const client = users.find(user => user.id === clientId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center items-center h-64">
            <LoadingIndicator variant="dots" size={42} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!client) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Client introuvable</DialogTitle>
          </DialogHeader>
          <p>Les informations du client n'ont pas pu être chargées.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Fiche client - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="text-lg">{client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{client.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                  <Badge variant="outline">{client.role}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                  <p className="text-sm">
                    {client.lastLogin 
                      ? new Date(client.lastLogin).toLocaleDateString('fr-FR')
                      : "Jamais connecté"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site WordPress */}
          {client.wordpressConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site WordPress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom du site</label>
                    <p className="text-lg">{client.wordpressConfig.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL</label>
                    <a 
                      href={client.wordpressConfig.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.wordpressConfig.site_url}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Annonces publiées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Annonces publiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité à implémenter</p>
                <p className="text-sm">L'historique des annonces sera affiché ici</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailDialog;
