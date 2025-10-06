
import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, ImageIcon, Share2 } from "lucide-react";
import { useRecentAnnouncements } from "@/hooks/useRecentAnnouncements";

const RecentAnnouncements = () => {
  const { announcements, isLoading, error } = useRecentAnnouncements(5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500 text-white">Publié</Badge>;
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500 text-white">Programmé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-destructive">
        Erreur lors du chargement des annonces
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground dark:text-gray-300">
        Aucune annonce récente. <Link to="/create" className="text-primary dark:text-blue-300 hover:underline">Créer une annonce</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <Link
          key={announcement.id}
          to={`/announcements/${announcement.id}`}
          className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-shrink-0">
            {announcement.images && announcement.images.length > 0 ? (
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {announcement.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(announcement.created_at), "dd MMM", { locale: fr })}
              </div>
              {announcement.create_facebook_post && announcement.status === 'published' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs h-5 px-1.5">
                  <Share2 className="h-2.5 w-2.5 mr-0.5" />
                  FB
                </Badge>
              )}
              {announcement.create_instagram_post && announcement.status === 'published' && (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 text-xs h-5 px-1.5">
                  <Share2 className="h-2.5 w-2.5 mr-0.5" />
                  IG
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {getStatusBadge(announcement.status)}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecentAnnouncements;
