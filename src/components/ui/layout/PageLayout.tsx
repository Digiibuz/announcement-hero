
import React from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";

export interface PageLayoutProps {
  title: string;
  description?: string; // Add this prop to support the TomEManagement component
  titleAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const PageLayout = ({
  title,
  description,
  titleAction,
  children,
  className,
  contentClassName
}: PageLayoutProps) => {
  return (
    <div className={cn("flex flex-col flex-1 min-h-screen", className)}>
      <Header title={title} description={description} titleAction={titleAction} />
      <main className={cn("flex-1 p-4 md:p-6", contentClassName)}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
