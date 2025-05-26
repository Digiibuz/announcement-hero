
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import AnnouncementActions from "@/components/announcements/detail/AnnouncementActions";
import AnnouncementTabs from "@/components/announcements/detail/AnnouncementTabs";
import { useAnnouncementDetail } from "@/components/announcements/detail/useAnnouncementDetail";
import { Announcement } from "@/types/announcement";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const AnnouncementDetail = () => {
  const { user } = useAuth();
  const {
    announcement,
    isLoading,
    isEditing,
    setIsEditing,
    isSubmitting,
    isPublishing,
    activeTab,
    setActiveTab,
    fetchAnnouncement,
    handleSubmit,
    formData,
    canPublish,
    publicationStats
  } = useAnnouncementDetail(user?.id);

  const titleAction = announcement ? (
    <AnnouncementActions
      id={announcement.id}
      status={announcement.status}
      wordpressPostId={announcement.wordpress_post_id}
      seoSlug={announcement.seo_slug}
    />
  ) : null;

  return (
    <PageLayout title={isLoading ? "Chargement..." : announcement?.title} titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        {/* Publication limit warning */}
        {!canPublish() && (
          <div className="mb-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-800 text-lg">Limite mensuelle atteinte</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700 mb-2">
                  Vous avez publié {publicationStats.publishedCount}/{publicationStats.maxLimit} annonces ce mois-ci.
                </p>
                <p className="text-orange-600 text-sm">
                  Vous ne pouvez plus publier d'annonces ce mois-ci. Les modifications seront sauvegardées en brouillon.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 flex flex-col items-center py-12">
            <LoadingIndicator variant="dots" size={32} />
          </div>
        ) : announcement ? (
          <AnnouncementTabs
            announcement={announcement as Announcement}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setIsEditing={setIsEditing}
            handleSubmit={handleSubmit}
            formData={formData}
          />
        ) : (
          <div>Annonce non trouvée.</div>
        )}
      </AnimatedContainer>
    </PageLayout>
  );
};

export default AnnouncementDetail;
