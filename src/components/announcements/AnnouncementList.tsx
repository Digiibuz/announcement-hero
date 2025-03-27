
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Pencil, 
  Trash2, 
  Image as ImageIcon,
  Eye,
  Calendar,
  Clock,
  FileText,
  MoreHorizontal,
  CheckCircle,
  Clock as ClockIcon,
  FileEdit
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Publié
          </div>
        );
      case "draft":
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 text-xs font-medium">
            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
            Brouillon
          </div>
        );
      case "scheduled":
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium">
            <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
            Planifié
          </div>
        );
      default:
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 text-xs font-medium">
            {status}
          </div>
        );
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
    <div className="rounded-lg border overflow-hidden bg-card">
      <div className="grid grid-cols-12 py-3 px-4 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="col-span-4 sm:col-span-5">Annonce</div>
        <div className="col-span-3 sm:col-span-2 hidden sm:block">Statut</div>
        <div className="col-span-2 hidden md:block">Catégorie</div>
        <div className="col-span-3 sm:col-span-2 text-center hidden sm:block">Date de publication</div>
        <div className="col-span-3 sm:col-span-2 text-center hidden lg:block">Date de création</div>
        <div className="col-span-8 sm:col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="grid grid-cols-12 py-4 px-4 items-center hover:bg-muted/20 transition-colors">
            <div className="col-span-4 sm:col-span-5 flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                {announcement.images && announcement.images.length > 0 ? (
                  <img 
                    src={announcement.images[0]} 
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{announcement.title}</p>
                {announcement.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {announcement.description}
                  </p>
                )}
              </div>
            </div>

            <div className="col-span-3 sm:col-span-2 hidden sm:block">
              {getStatusBadge(announcement.status)}
            </div>

            <div className="col-span-2 hidden md:block text-sm">
              {announcement.wordpress_category_id || "—"}
            </div>

            <div className="col-span-3 sm:col-span-2 text-sm text-center hidden sm:flex justify-center items-center">
              {announcement.publish_date ? (
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <span>{format(new Date(announcement.publish_date), "dd MMM yyyy", { locale: fr })}</span>
                </div>
              ) : (
                "—"
              )}
            </div>

            <div className="col-span-3 sm:col-span-2 text-sm text-center hidden lg:flex justify-center items-center">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <span>{format(new Date(announcement.created_at), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            </div>

            <div className="col-span-8 sm:col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/announcements/${announcement.id}`} className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      <span>Voir</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/announcements/${announcement.id}/edit`} className="flex items-center">
                      <Pencil className="h-4 w-4 mr-2" />
                      <span>Modifier</span>
                    </Link>
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementList;
