
import React, { useState } from "react";
import { useOptimizedImage } from "@/hooks/use-optimized-image";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  placeholderSrc?: string;
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  quality?: "low" | "medium" | "high";
  showLoadingState?: boolean;
  enableNativeLazyLoading?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  lowQualitySrc,
  placeholderSrc = "/placeholder.svg",
  aspectRatio,
  width,
  height,
  objectFit = "cover",
  quality = "medium",
  className,
  showLoadingState = true,
  enableNativeLazyLoading = true,
  priority = false,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isNativeError, setIsNativeError] = useState(false);
  const {
    src: optimizedSrc,
    srcSet,
    sizes,
    status,
    imgProps
  } = useOptimizedImage({
    src,
    lowQualitySrc,
    placeholderSrc,
    quality,
    lazyLoad: !priority && enableNativeLazyLoading,
  });

  // Gérer les erreurs natives
  const handleNativeError = () => {
    setIsNativeError(true);
    if (onError) onError();
  };

  // Gérer le chargement réussi
  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  // Styles pour le conteneur et l'image
  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : undefined,
    aspectRatio: aspectRatio,
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    width: "100%",
    height: "100%",
    display: "block",
  };

  // Déterminer si on doit montrer l'état de chargement
  const shouldShowLoading = showLoadingState && status === "loading";

  return (
    <div 
      style={containerStyle} 
      className={cn("bg-muted", className)}
      {...props}
    >
      {shouldShowLoading && (
        <Skeleton 
          className="absolute inset-0 z-10" 
        />
      )}

      <img
        {...imgProps}
        alt={alt}
        width={width as number}
        height={height as number}
        style={{
          ...imageStyle,
          ...imgProps.style,
        }}
        onError={handleNativeError}
        onLoad={handleLoad}
        loading={!priority && enableNativeLazyLoading ? "lazy" : undefined}
        fetchPriority={priority ? "high" : "auto"}
        decoding={"async" as "async" | "auto" | "sync"}
      />

      {isNativeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <span className="text-sm text-muted-foreground">
            {alt || "Image non disponible"}
          </span>
        </div>
      )}
    </div>
  );
}
