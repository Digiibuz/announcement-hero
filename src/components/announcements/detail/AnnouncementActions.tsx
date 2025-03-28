
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";

interface AnnouncementActionsProps {
  announcement?: Announcement;
  userId?: string;
  isPublishing?: boolean;
  setIsEditing: (isEditing: boolean) => void;
  fetchAnnouncement: () => void;
}

const AnnouncementActions = ({
  announcement,
  userId,
  isPublishing,
  setIsEditing,
  fetchAnnouncement,
}: AnnouncementActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const { publishToWordPress } = useWordPressPublishing();

  const handleDelete = async () => {
    if (!announcement?.id) return;
    
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la suppression",
        description: error.message,
      });
      return;
    }
    
    window.location.href = "/announcements";
  };

  const handlePublishToWordPress = async () => {
    if (!announcement?.id) return;
    await publishToWordPress(announcement.id);
    fetchAnnouncement();
  };
  
  // Vérifie si l'annonce est publiée sur WordPress
  const isPublishedToWordPress = announcement && 
    // @ts-ignore - Ces propriétés existent dans la base de données mais pas dans le type
    announcement.wordpress_post_id && 
    // @ts-ignore
    announcement.wordpress_site_url;

  // Génère l'URL vers l'article WordPress
  const wordPressUrl = isPublishedToWordPress ? 
    // @ts-ignore
    `${announcement.wordpress_site_url}/wp-admin/post.php?post=${announcement.wordpress_post_id}&action=edit` : 
    null;

  return (
    <div className="flex items-center gap-2">
      {announcement?.status === "published" && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePublishToWordPress}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>Traitement...</>
          ) : isPublishedToWordPress ? (
            <>Republier sur WordPress</>
          ) : (
            <>Publier sur WordPress</>
          )}
        </Button>
      )}

      {/* Affiche le lien WordPress si l'annonce est publiée sur WordPress */}
      {isPublishedToWordPress && (
        <Button variant="outline" size="sm" asChild>
          <a href={wordPressUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir sur WordPress
          </a>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. L'annonce sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementActions;
