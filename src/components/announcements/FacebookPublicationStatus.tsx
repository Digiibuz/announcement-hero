import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Announcement } from "@/types/announcement";

interface FacebookPublicationStatusProps {
  announcement: Announcement;
}

const FacebookPublicationStatus = ({ announcement }: FacebookPublicationStatusProps) => {
  if (!announcement.create_facebook_post) {
    return null;
  }

  const getStatusIcon = () => {
    switch (announcement.facebook_publication_status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (announcement.facebook_publication_status) {
      case 'success':
        return 'Publié avec succès';
      case 'error':
        return 'Échec de publication';
      case 'pending':
      default:
        return 'Publication en cours...';
    }
  };

  const getStatusVariant = () => {
    switch (announcement.facebook_publication_status) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      case 'pending':
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Publication Facebook</span>
            <Badge variant={getStatusVariant()}>
              {getStatusText()}
            </Badge>
          </div>
          
          {announcement.facebook_url && announcement.facebook_publication_status === 'success' && (
            <a
              href={announcement.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              Voir le post <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        
        {announcement.facebook_published_at && announcement.facebook_publication_status === 'success' && (
          <p className="text-sm text-muted-foreground mt-2">
            Publié le {new Date(announcement.facebook_published_at).toLocaleString('fr-FR')}
          </p>
        )}
        
        {announcement.facebook_error_message && announcement.facebook_publication_status === 'error' && (
          <p className="text-sm text-red-600 mt-2">
            Erreur: {announcement.facebook_error_message}
          </p>
        )}
        
        {announcement.facebook_publication_status === 'pending' && (
          <p className="text-sm text-muted-foreground mt-2">
            La publication sur Facebook est en cours via Zapier. Le statut se mettra à jour automatiquement.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FacebookPublicationStatus;