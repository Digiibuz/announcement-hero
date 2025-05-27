import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Archive, ExternalLink, RefreshCw } from "lucide-react";
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
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { supabase } from "@/integrations/supabase/client";

interface AnnouncementActionsProps {
  id: string;
  status: string;
  wordpressPostId?: number | null;
  seoSlug?: string;
}

const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({ 
  id, 
  status, 
  wordpressPostId, 
  seoSlug 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { configs } = useWordPressConfigs();
  const { canPublish, stats } = usePublicationLimits();
  const { publishToWordPress } = useWordPressPublishing();

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
    // Check publication limits before publishing
    if (!canPublish()) {
      toast({
        title: "Limite atteinte",
        description: `Vous avez atteint votre limite de ${stats.maxLimit} publications ce mois-ci.`,
        variant: "destructive",
      });
      return;
    }

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

  const updateOnWordPress = async () => {
    if (!wordpressPostId || !user?.id) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour : annonce non publiée sur WordPress.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Get the current announcement data
      const { data: announcement, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !announcement) {
        throw new Error("Impossible de récupérer les données de l'annonce");
      }

      // Get WordPress category ID
      const wordpressCategoryId = announcement.wordpress_category_id;
      if (!wordpressCategoryId) {
        throw new Error("Catégorie WordPress manquante");
      }

      // Use the publishing hook to update the WordPress post
      const result = await publishToWordPress(
        announcement,
        wordpressCategoryId,
        user.id
      );

      if (result.success) {
        toast({
          title: "Mise à jour réussie",
          description: "L'annonce a été mise à jour sur WordPress avec succès.",
        });
        queryClient.invalidateQueries({ queryKey: ["announcement", id] });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error updating on WordPress:", error);
      toast({
        title: "Erreur de mise à jour",
        description: `Impossible de mettre à jour sur WordPress: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const viewOnWordPress = () => {
    if (!wordpressPostId || !configs || configs.length === 0) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver le lien vers l'annonce.",
        variant: "destructive",
      });
      return;
    }

    // Get the WordPress site URL from the first config (assuming single config for now)
    const wordpressConfig = configs[0];
    const siteUrl = wordpressConfig.site_url.replace(/\/+$/, ''); // Remove trailing slashes
    
    // Build the URL: use seoSlug directly without /annonces/ prefix
    let postUrl;
    if (seoSlug) {
      postUrl = `${siteUrl}/${seoSlug}`;
    } else {
      postUrl = `${siteUrl}/?p=${wordpressPostId}`;
    }
    
    window.open(postUrl, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* View on WordPress button - only show if the post is published and has a WordPress post ID */}
      {status === "published" && wordpressPostId && (
        <Button 
          onClick={viewOnWordPress}
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Voir sur le site
        </Button>
      )}

      {/* Update on WordPress button - only show if published and has WordPress post ID */}
      {status === "published" && wordpressPostId && (
        <Button 
          onClick={updateOnWordPress}
          disabled={isUpdating}
          variant="outline"
          className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Mettre à jour sur WordPress
            </>
          )}
        </Button>
      )}

      {status !== "published" && (
        <Button 
          onClick={publishAnnouncement}
          disabled={isPublishing || !canPublish()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          title={!canPublish() ? `Limite de ${stats.maxLimit} publications atteinte ce mois-ci` : ""}
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
  );
};

export default AnnouncementActions;
