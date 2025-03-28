
import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  titleAction?: React.ReactNode;
}

const PageLayout = ({ children, title, titleAction }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-0">
          {(title || titleAction) && (
            <AnimatedContainer delay={100}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pt-4">
                {title && <h1 className="text-2xl md:text-3xl font-bold mb-2 sm:mb-0">{title}</h1>}
                {titleAction && <div>{titleAction}</div>}
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
