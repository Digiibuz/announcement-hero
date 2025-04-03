
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Lottie from "lottie-react";
import cornersAnimation from "/animations/corners-loading.json";

interface LoadingIndicatorProps {
  variant?: "spinner" | "dots" | "skeleton" | "progress" | "lottie";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullPage?: boolean;
  logo?: string;
}

const LoadingIndicator = ({
  variant = "spinner",
  size = "md",
  className,
  text,
  fullPage = false,
  logo,
}: LoadingIndicatorProps) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  const lottieSizeClass = {
    sm: "h-20 w-20",
    md: "h-32 w-32",
    lg: "h-48 w-48",
  };

  const containerClass = fullPage
    ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    : "flex items-center justify-center";

  const renderLoadingElement = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-pulse",
                  size === "sm" ? "h-1.5 w-1.5" : size === "md" ? "h-2 w-2" : "h-3 w-3"
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        );
      case "skeleton":
        return (
          <div className="space-y-2 w-full max-w-md">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        );
      case "progress":
        return (
          <div className="w-full max-w-md">
            <div className="h-1 w-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]"
                style={{
                  backgroundSize: "200% 100%",
                  backgroundImage: "linear-gradient(to right, transparent 0%, hsl(var(--primary)) 50%, transparent 100%)",
                }}
              />
            </div>
          </div>
        );
      case "lottie":
        return (
          <div className={cn("relative", lottieSizeClass[size])}>
            {logo ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-12 w-auto z-10" 
                />
              </div>
            ) : null}
            <Lottie 
              animationData={cornersAnimation} 
              loop={true}
              className="w-full h-full"
            />
          </div>
        );
      case "spinner":
      default:
        return <Loader2 className={cn("animate-spin text-primary", sizeClass[size])} />;
    }
  };

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col items-center gap-2">
        {renderLoadingElement()}
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
};

export { LoadingIndicator };
