
"use client"

import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { LoadingIndicator } from "../loading-indicator";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  titleAction?: React.ReactNode;
  fullWidthMobile?: boolean;
  containerClassName?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const PageLayout = ({ 
  children, 
  title, 
  titleAction, 
  fullWidthMobile = false,
  containerClassName,
  onRefresh,
  isLoading = false
}: PageLayoutProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isAdmin, isClient, isImpersonating } = useAuth();
  const location = useLocation();
  
  const isAdminPage = location.pathname === '/users' || location.pathname === '/wordpress';
  const isCreateAnnouncementPage = location.pathname.includes('/create-announcement');
  
  const handleDefaultRefresh = () => {
    window.location.reload();
  };

  const handleRefresh = onRefresh || handleDefaultRefresh;

  const showRefreshButton = (isAdmin || isClient) && isAdminPage;

  const bannerPadding = isImpersonating ? "pt-12" : "";

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <LoadingIndicator variant="dots" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Header />
      <Sidebar />

      <main className={`pt-16 md:pl-64 ${bannerPadding}`}>
        <div className={`container ${fullWidthMobile && isMobile ? 'px-0 sm:px-4' : 'px-4'} py-0 pb-16 ${containerClassName || ''}`}>
          {(title || titleAction || showRefreshButton) && (
            <AnimatedContainer delay={100} className={containerClassName?.includes('max-w-full') ? 'w-full' : ''}>
              <div className={`flex flex-col ${!isMobile ? "sm:flex-row sm:items-center sm:justify-between" : ""} mb-4 ${isMobile ? "pt-0 px-4" : "pt-2"} gap-3`}>
                <div className="flex flex-row items-center gap-4">
                  {title && <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>}
                  {showRefreshButton && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={handleRefresh}
                      title="Rafraîchir la page"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rafraîchir
                    </Button>
                  )}
                </div>
                <div className={`${isMobile ? "w-full" : ""} flex items-center gap-2`}>
                  {titleAction && <div>{titleAction}</div>}
                </div>
              </div>
            </AnimatedContainer>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
