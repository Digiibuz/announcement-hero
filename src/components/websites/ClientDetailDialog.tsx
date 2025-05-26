
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserManagement } from "@/hooks/useUserManagement";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { User, Globe, Calendar, FileText, Eye, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Announcement } from "@/types/announcement";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientDetailDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientDetailDialog = ({ clientId, open, onOpenChange }: ClientDetailDialogProps) => {
  const { users, isLoading } = useUserManagement();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  
  const client = users.find(user => user.id === clientId);

  // Fetch client's announcements
  useEffect(() => {
    const fetchClientAnnouncements = async () => {
      if (!clientId || !open) return;
      
      try {
        setIsLoadingAnnouncements(true);
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching client announcements:', error);
          return;
        }

        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching client announcements:', error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    fetchClientAnnouncements();
  }, [clientId, open]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Publié</Badge>;
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Programmé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {client.wordpressConfig.site_url}
                      <ExternalLink className="h-4 w-4" />
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
                Annonces publiées ({announcements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnnouncements ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingIndicator variant="dots" size={32} />
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                        {getStatusBadge(announcement.status)}
                      </div>
                      
                      {announcement.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {announcement.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(announcement.created_at), "dd MMM yyyy", { locale: fr })}
                          </div>
                          {announcement.wordpress_post_id && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              WordPress ID: {announcement.wordpress_post_id}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => window.open(`/announcements/${announcement.id}`, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune annonce trouvée</p>
                  <p className="text-sm">Ce client n'a pas encore créé d'annonces</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailDialog;
