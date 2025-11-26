import React, { useState } from "react";
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
import { format } from "date-fns";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useEffect } from "react";

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

  // Charger les catégories pour l'édition
  const { isLoading: isCategoriesLoading, hasCategories, error: categoriesError } = useWordPressCategories();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Afficher l'overlay immédiatement quand on passe en mode édition
  useEffect(() => {
    if (isEditing) {
      setShowLoadingOverlay(true);
      setLoadingTimeout(false); // Réinitialiser le timeout
    }
  }, [isEditing]);

  // Cacher l'overlay quand les catégories sont chargées, avec timeout
  useEffect(() => {
    if (!showLoadingOverlay) return;

    // Timeout absolu de 15 secondes pour éviter un chargement infini
    const timeoutTimer = setTimeout(() => {
      console.warn("⚠️ Timeout du chargement des catégories après 15 secondes (édition)");
      setLoadingTimeout(true);
      setShowLoadingOverlay(false);
    }, 15000);

    // Masquer l'overlay si les catégories sont chargées avec succès
    if (!isCategoriesLoading && hasCategories) {
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 500);
      return () => {
        clearTimeout(timer);
        clearTimeout(timeoutTimer);
      };
    }

    // Masquer l'overlay si une erreur se produit
    if (!isCategoriesLoading && categoriesError) {
      console.error("❌ Erreur lors du chargement des catégories (édition):", categoriesError);
      setShowLoadingOverlay(false);
      clearTimeout(timeoutTimer);
    }

    return () => clearTimeout(timeoutTimer);
  }, [showLoadingOverlay, isCategoriesLoading, hasCategories, categoriesError]);

  const titleAction = announcement ? (
    <AnnouncementActions
      id={announcement.id}
      status={announcement.status}
      wordpressPostId={announcement.wordpress_post_id}
      seoSlug={announcement.seo_slug}
      wordpressUrl={announcement.wordpress_url}
    />
  ) : null;

  // Calculer la date de remise à zéro (1er du mois suivant)
  const getResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return format(nextMonth, "dd/MM/yyyy");
  };

  return (
    <>
      {/* Overlay de chargement - bloque l'interface jusqu'au chargement des catégories en mode édition */}
      {showLoadingOverlay && <LoadingOverlay />}

      <PageLayout title={isLoading ? "Chargement..." : announcement?.title} titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        {/* Alerte si timeout du chargement des catégories en mode édition */}
        {loadingTimeout && isEditing && (
          <div className="mb-4">
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-800 text-lg">Problème de connexion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 mb-2">
                  Impossible de charger les catégories depuis votre site WordPress.
                </p>
                <p className="text-yellow-600 text-sm">
                  Cela peut être dû à un problème de connexion réseau ou à une restriction de sécurité. Vous pouvez continuer et réessayer plus tard.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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
                <p className="text-orange-600 text-sm mb-1">
                  Vous ne pouvez plus publier d'annonces ce mois-ci. Les modifications seront sauvegardées en brouillon.
                </p>
                <p className="text-orange-600 text-sm font-medium">
                  Remise à zéro le {getResetDate()}.
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
    </>
  );
};

export default AnnouncementDetail;
