import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnnouncementPreview from "@/components/announcements/AnnouncementPreview";
import { Announcement } from "@/types/announcement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing } = useWordPressPublishing();
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      setIsLoading(true);
      if (!id) return;

      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          wordpress_categories!inner (
            id,
            name
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        // Format data for the form
        const formattedData: Announcement = {
          ...data,
          wordpress_category_id: data.wordpress_categories?.id || null,
          wordpress_category_name: data.wordpress_categories?.name || null,
        };
        setAnnouncement(formattedData);
      }
    } catch (error: any) {
      console.error("Error fetching announcement:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!id || !user) return;
    
    try {
      setIsSubmitting(true);
      
      // Update announcement in database
      const { error } = await supabase
        .from("announcements")
        .update(formData)
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Annonce mise à jour avec succès");
      fetchAnnouncement();
      setIsEditing(false);
      setActiveTab("preview");
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishToWordPress = async () => {
    if (!announcement || !user) return;
    
    try {
      const result = await publishToWordPress(
        announcement,
        announcement.wordpress_category_id || "",
        user.id
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

  const titleAction = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate("/announcements")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      {announcement?.wordpress_post_id && (
        <Button variant="secondary" size="sm" asChild>
          <a href={`https://${announcement.wordpress_site_url}/?p=${announcement.wordpress_post_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
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
        variant="primary" 
        disabled={isPublishing} 
        onClick={handlePublishToWordPress}
      >
        {isPublishing ? "Publication..." : "Publier sur WordPress"}
      </Button>
    </div>
  );

  return (
    <PageLayout title={isLoading ? "Chargement..." : announcement?.title} titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-64" />
          </div>
        ) : announcement ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
              <TabsTrigger value="edit" disabled={!isEditing}>
                Modifier
                {isEditing && <Pencil className="h-4 w-4 ml-2" />}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <AnnouncementPreview announcement={announcement} />
            </TabsContent>
            <TabsContent value="edit">
              {isEditing ? (
                <AnnouncementForm
                  initialValues={announcement}
                  onSubmit={handleSubmit}
                  isLoading={isSubmitting}
                  onCancel={() => {
                    setIsEditing(false);
                    setActiveTab("preview");
                  }}
                />
              ) : (
                <Alert>
                  <AlertDescription>
                    Cliquez sur le bouton "Modifier" pour modifier cette annonce.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div>Annonce non trouvée.</div>
        )}
      </AnimatedContainer>
    </PageLayout>
  );
};

export default AnnouncementDetail;
