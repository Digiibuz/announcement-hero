
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnnouncementActionsProps {
  id: string;
  status: string;
  wordpressPostId?: number | null;
}

const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({ id, status, wordpressPostId }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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
      const result = await apiDeleteAnnouncement(id, user.id);
      
      if (result.success) {
        toast({
          title: "Annonce supprimée",
          description: result.message,
        });
        
        navigate("/announcements");
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      } else {
        setDeleteError(result.message);
        setDeleteErrorOpen(true);
        toast({
          title: "Erreur",
          description: "La suppression a échoué. Consultez les détails pour plus d'informations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setDeleteError("Une erreur inattendue s'est produite lors de la suppression.");
      setDeleteErrorOpen(true);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
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

      <Button 
        variant="destructive" 
        onClick={() => setConfirmDeleteOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Supprimer
      </Button>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement cette annonce.
              {wordpressPostId ? " Cela supprimera également l'article associé sur WordPress." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Annuler</AlertDialogCancel>
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

      {/* Boîte de dialogue d'erreur de suppression */}
      <Dialog open={deleteErrorOpen} onOpenChange={setDeleteErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur lors de la suppression</DialogTitle>
            <DialogDescription>
              {deleteError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteErrorOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementActions;
