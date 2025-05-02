
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/users/AccessDenied";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useWordPressManagement } from "@/components/wordpress/management/useWordPressManagement";
import WordPressManagementHeader from "@/components/wordpress/management/WordPressManagementHeader";
import WordPressConfigContent from "@/components/wordpress/management/WordPressConfigContent";

const WordPressManagement = () => {
  const { isAdmin, isClient } = useAuth();
  const {
    configs,
    isLoading,
    isSubmitting,
    error,
    isFetching,
    isDialogOpen,
    setIsDialogOpen,
    handleCreateConfig,
    handleUpdateConfig,
    deleteConfig,
    handleRefresh
  } = useWordPressManagement();

  // Change page title based on user role
  const pageTitle = isClient ? "Mon site" : "Gestion WordPress";

  // Title action component for the page header
  const titleAction = (
    <WordPressManagementHeader
      isAdmin={!!isAdmin}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isSubmitting={isSubmitting}
      createConfig={handleCreateConfig}
    />
  );

  // If roles are not yet determined, display a loading indicator
  if (isAdmin === undefined && isClient === undefined) {
    return (
      <PageLayout title="Chargement...">
        <div className="h-64 flex items-center justify-center">
          <LoadingIndicator variant="dots" size={42} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={pageTitle} 
      titleAction={titleAction}
      onRefresh={handleRefresh}
      refreshButtonProps={{ disabled: isFetching }}
    >
      {!(isAdmin || isClient) ? (
        <AccessDenied />
      ) : (
        <AnimatedContainer delay={200}>
          <WordPressConfigContent 
            isClient={isClient}
            configs={configs}
            isLoading={isLoading}
            isFetching={isFetching}
            isSubmitting={isSubmitting}
            error={error}
            handleUpdateConfig={handleUpdateConfig}
            deleteConfig={deleteConfig}
          />
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default WordPressManagement;
