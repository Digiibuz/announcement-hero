
import React from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";

export interface PageLayoutProps {
  title: string;
  description?: string;
  titleAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  containerClassName?: string;
  fullWidthMobile?: boolean;
  onRefresh?: () => void;
}

const PageLayout = ({
  title,
  description,
  titleAction,
  children,
  className,
  contentClassName,
  containerClassName,
  fullWidthMobile,
  onRefresh
}: PageLayoutProps) => {
  return (
    <div className={cn("flex flex-col flex-1 min-h-screen", className)}>
      <Header 
        title={title} 
        description={description} 
        titleAction={titleAction}
        onRefresh={onRefresh}
      />
      <main className={cn("flex-1 p-4 md:p-6", contentClassName)}>
        <div className={containerClassName}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
