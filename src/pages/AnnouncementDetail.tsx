
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Skeleton } from "@/components/ui/skeleton";
import AnnouncementActions from "@/components/announcements/detail/AnnouncementActions";
import AnnouncementTabs from "@/components/announcements/detail/AnnouncementTabs";
import { useAnnouncementDetail } from "@/components/announcements/detail/useAnnouncementDetail";
import { Announcement } from "@/types/announcement";

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
    handleSubmit
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
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-64" />
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
          />
        ) : (
          <div>Annonce non trouvée.</div>
        )}
      </AnimatedContainer>
    </PageLayout>
  );
};

export default AnnouncementDetail;
