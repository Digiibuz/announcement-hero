
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
  Trash2, 
  ImageIcon,
  Eye,
  Calendar,
  CalendarClock,
  Tag,
  MessageSquareText
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  viewMode?: "table" | "grid";
}

const AnnouncementList = ({ 
  announcements, 
  isLoading,
  onDelete,
  viewMode = "table"
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

  // Function to get the public URL for an image
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    // Handle both full URLs and storage paths
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const { data } = supabase.storage.from('images').getPublicUrl(imagePath);
    return data.publicUrl;
  };

  // Function to count words in a text
  const countWords = (text: string | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (isLoading) {
    return viewMode === "table" ? (
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
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[220px]">
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-4/5 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
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

  // Table view
  if (viewMode === "table") {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Annonce</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Date de publication</TableHead>
              <TableHead>Mots</TableHead>
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
                <TableCell>
                  {announcement.wordpress_category_name ? (
                    <div className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {announcement.wordpress_category_name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
                <TableCell>
                  <div className="flex items-center">
                    <MessageSquareText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    {countWords(announcement.description)}
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
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
          {/* Image section */}
          <div className="w-full">
            <AspectRatio ratio={16/9}>
              {announcement.images && announcement.images.length > 0 ? (
                <img 
                  src={getImageUrl(announcement.images[0])} 
                  alt={announcement.title}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error("Image loading error:", e);
                    // Replace with placeholder on error
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted/40">
                  <ImageIcon className="h-12 w-12 text-muted/50" />
                </div>
              )}
            </AspectRatio>
          </div>
          
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg line-clamp-2">
                {announcement.title}
              </CardTitle>
              {getStatusBadge(announcement.status)}
            </div>
          </CardHeader>
          
          <CardContent className="pb-0 flex-grow">
            {announcement.wordpress_category_name && (
              <div className="flex items-center mb-2 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5 mr-2" />
                {announcement.wordpress_category_name}
              </div>
            )}
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                {format(new Date(announcement.created_at), "dd MMM yyyy", { locale: fr })}
              </div>
              {announcement.publish_date && (
                <div className="flex items-center">
                  <CalendarClock className="h-3.5 w-3.5 mr-2" />
                  {format(new Date(announcement.publish_date), "dd MMM yyyy", { locale: fr })}
                </div>
              )}
              <div className="flex items-center">
                <MessageSquareText className="h-3.5 w-3.5 mr-2" />
                {countWords(announcement.description)} mots
              </div>
            </div>
            {announcement.description && (
              <p className="mt-2 text-sm line-clamp-2 text-muted-foreground">{announcement.description}</p>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/announcements/${announcement.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  Supprimer
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementList;
