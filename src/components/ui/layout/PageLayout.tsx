
import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  titleAction?: React.ReactNode;
}

const PageLayout = ({ children, title, titleAction }: PageLayoutProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-0">
          {(title || titleAction) && (
            <AnimatedContainer delay={100}>
              <div className={`flex flex-col ${!isMobile ? "sm:flex-row sm:items-center sm:justify-between" : ""} mb-4 ${isMobile ? "pt-0" : "pt-2"} gap-3`}>
                {title && <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>}
                {titleAction && <div className={`${isMobile ? "w-full" : ""}`}>{titleAction}</div>}
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
