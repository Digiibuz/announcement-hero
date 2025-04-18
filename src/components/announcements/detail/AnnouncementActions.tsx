
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
  publishAnnouncement as apiPublishAnnouncement,
  publishAnnouncementDirect as apiPublishAnnouncementDirect 
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
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isDirectPublishing, setIsDirectPublishing] = useState(false);
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
      
      const successMessage = wordpressPostId 
        ? "L'annonce a été supprimée de l'application et de WordPress."
        : "L'annonce a été supprimée avec succès.";
      
      toast({
        title: "Annonce supprimée",
        description: successMessage,
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
    } catch (error: any) {
      console.error("Error publishing announcement:", error);
      setPublishError(error.message || "Impossible de publier l'annonce");
      setShowErrorDialog(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const publishDirectly = async () => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Utilisateur non identifié.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsDirectPublishing(true);
      await apiPublishAnnouncementDirect(id, user.id);
      toast({
        title: "Annonce publiée",
        description: "L'annonce a été publiée directement sur WordPress avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["announcement", id] });
      setShowErrorDialog(false);
    } catch (error: any) {
      console.error("Error with direct publishing:", error);
      toast({
        title: "Erreur de publication directe",
        description: error.message || "Impossible de publier directement sur WordPress",
        variant: "destructive",
      });
    } finally {
      setIsDirectPublishing(false);
    }
  };

  return (
    <>
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
                {wordpressPostId ? " Cela supprimera également l'article associé sur WordPress." : ""}
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

      {/* Dialog pour afficher les erreurs de publication et proposer une publication directe */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur de publication</DialogTitle>
            <DialogDescription>
              La publication via l'API a échoué. Détails de l'erreur :
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-auto max-h-24">
                {publishError}
              </div>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            Voulez-vous essayer de publier directement sur WordPress ? Cette méthode alternative peut fonctionner si l'API est indisponible.
          </p>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowErrorDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              onClick={publishDirectly} 
              disabled={isDirectPublishing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isDirectPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publication directe...
                </>
              ) : (
                "Publier directement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementActions;
