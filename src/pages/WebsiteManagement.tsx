
import React from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/users/AccessDenied";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import WebsiteOverviewTable from "@/components/websites/WebsiteOverviewTable";

const WebsiteManagement = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <PageLayout title="Gestion des sites web">
        <AccessDenied />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Gestion des sites web">
      <AnimatedContainer delay={200}>
        <div className="w-full">
          <WebsiteOverviewTable />
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default WebsiteManagement;
