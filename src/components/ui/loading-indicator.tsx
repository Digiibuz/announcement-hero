
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  className?: string;
  size?: number;
  color?: string;
  variant?: "spinner" | "dots" | "pulse";
}

export function LoadingIndicator({
  className,
  size = 32,
  color,
  variant = "spinner",
}: LoadingIndicatorProps) {
  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2
          size={size}
          className="animate-spin text-digibuz-yellow"
          style={color ? { color } : undefined}
        />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 w-3 rounded-full bg-digibuz-yellow animate-pulse",
              i === 1 && "animation-delay-200",
              i === 2 && "animation-delay-500"
            )}
            style={{
              animationDelay: `${i * 150}ms`,
              ...(color ? { backgroundColor: color } : {})
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <div
          className="absolute h-16 w-16 rounded-full bg-digibuz-yellow/20 animate-ping"
          style={color ? { backgroundColor: `${color}33` } : undefined}
        />
        <div
          className="h-12 w-12 rounded-full bg-digibuz-yellow"
          style={color ? { backgroundColor: color } : undefined}
        />
      </div>
    );
  }

  return null;
}
