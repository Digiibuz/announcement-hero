
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Archive } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  deleteAnnouncement as apiDeleteAnnouncement,
  publishAnnouncement as apiPublishAnnouncement 
} from "@/api/announcementApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AnnouncementActionsProps {
  id: string;
  status: string;
}

const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({ id, status }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const deleteAnnouncement = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Erreur",
          description: "Utilisateur non identifié.",
          variant: "destructive",
        });
        return;
      }
      
      setIsDeleting(true);
      await apiDeleteAnnouncement(id, user.id);
      toast({
        title: "Annonce supprimée",
        description: "L'annonce a été supprimée avec succès.",
      });
      navigate("/announcements");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const publishAnnouncement = async () => {
    try {
      setIsPublishing(true);
      await apiPublishAnnouncement(id);
      toast({
        title: "Annonce publiée",
        description: "L'annonce a été publiée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["announcement", id] });
    } catch (error) {
      console.error("Error publishing announcement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier l'annonce.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {status !== "published" && (
        <Button 
          onClick={publishAnnouncement}
          disabled={isPublishing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publier
            </>
          )}
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement cette annonce.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteAnnouncement}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementActions;
