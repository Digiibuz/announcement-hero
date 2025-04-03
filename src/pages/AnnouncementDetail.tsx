
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Skeleton } from "@/components/ui/skeleton";
import AnnouncementActions from "@/components/announcements/detail/AnnouncementActions";
import AnnouncementTabs from "@/components/announcements/detail/AnnouncementTabs";
import { useAnnouncementDetail } from "@/components/announcements/detail/useAnnouncementDetail";
import { Announcement } from "@/types/announcement";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

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
    formData
  } = useAnnouncementDetail(user?.id);

  const titleAction = announcement ? (
    <AnnouncementActions
      id={announcement.id}
      status={announcement.status}
    />
  ) : null;

  return (
    <PageLayout title={isLoading ? "Chargement..." : announcement?.title} titleAction={titleAction}>
      <AnimatedContainer delay={200}>
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
