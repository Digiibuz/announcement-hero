
import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedContainer = ({ 
  children, 
  className,
  delay = 0 
}: AnimatedContainerProps) => {
  return (
    <div
      className={cn(
        "animate-in fade-in duration-500",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        opacity: 0,
        animationFillMode: "forwards"
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
