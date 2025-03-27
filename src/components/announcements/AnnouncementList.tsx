import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Pencil, 
  Trash2, 
  Image as ImageIcon,
  Eye,
  Calendar,
  CalendarClock
} from "lucide-react";
import { Announcement } from "@/types/announcement";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const AnnouncementList = ({ 
  announcements, 
  isLoading,
  onDelete 
}: AnnouncementListProps) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-2/5 mb-2" />
            <Skeleton className="h-4 w-4/5 mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
        <div className="mb-4">
          <ImageIcon size={48} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Aucune annonce trouvée</h3>
        <p className="text-muted-foreground mt-2">
          Créez votre première annonce en cliquant sur le bouton "Créer une annonce"
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Annonce</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Date de publication</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id}>
              <TableCell className="font-medium">
                {announcement.title}
                {announcement.images?.length > 0 && (
                  <span className="ml-2">
                    <ImageIcon size={14} className="inline text-muted-foreground" />
                  </span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(announcement.status)}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {format(new Date(announcement.created_at), "dd MMM yyyy", { locale: fr })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <CalendarClock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {announcement.publish_date 
                    ? format(new Date(announcement.publish_date), "dd MMM yyyy", { locale: fr })
                    : "—"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/announcements/${announcement.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Voir</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/announcements/${announcement.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette annonce?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement cette annonce?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDelete(announcement.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AnnouncementList;
