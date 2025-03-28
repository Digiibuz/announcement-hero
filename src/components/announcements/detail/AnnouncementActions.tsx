
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnnouncementActionsProps {
  announcement: Announcement | null;
  userId: string | undefined;
  isPublishing: boolean;
  setIsEditing: (value: boolean) => void;
  fetchAnnouncement: () => Promise<void>;
}

const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({
  announcement,
  userId,
  isPublishing,
  setIsEditing,
  fetchAnnouncement,
}) => {
  const navigate = useNavigate();
  const { publishToWordPress } = useWordPressPublishing();

  const handlePublishToWordPress = async () => {
    if (!announcement || !userId) return;
    
    try {
      const result = await publishToWordPress(
        announcement,
        announcement.wordpress_category_id || "",
        userId
      );
      
      if (result.success) {
        toast.success(result.message);
        
        // Update the WordPress post ID in the database if available
        if (result.wordpressPostId) {
          const { error } = await supabase
            .from("announcements")
            .update({
              wordpress_post_id: result.wordpressPostId,
              wordpress_published_at: new Date().toISOString()
            })
            .eq("id", announcement.id);
            
          if (error) {
            console.error("Error updating WordPress post ID:", error);
          } else {
            fetchAnnouncement();
          }
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      toast.error(`Erreur de publication: ${error.message}`);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate("/announcements")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      {announcement?.wordpress_post_id && announcement?.wordpress_site_url && (
        <Button variant="secondary" size="sm" asChild>
          <a 
            href={`https://${announcement.wordpress_site_url}/?p=${announcement.wordpress_post_id}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center"
          >
            Voir sur WordPress
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      )}
      <Button size="sm" onClick={() => setIsEditing(true)}>
        <Pencil className="h-4 w-4 mr-2" />
        Modifier
      </Button>
      <Button 
        size="sm" 
        variant="secondary" 
        disabled={isPublishing} 
        onClick={handlePublishToWordPress}
      >
        {isPublishing ? "Publication..." : "Publier sur WordPress"}
      </Button>
    </div>
  );
};

export default AnnouncementActions;
