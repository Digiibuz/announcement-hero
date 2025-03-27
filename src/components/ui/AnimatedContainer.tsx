
import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

const AnimatedContainer = ({
  children,
  delay = 0,
  direction = "up",
  className,
  ...props
}: AnimatedContainerProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransformStyles = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "translate-y-8 opacity-0";
        case "down":
          return "-translate-y-8 opacity-0";
        case "left":
          return "translate-x-8 opacity-0";
        case "right":
          return "-translate-x-8 opacity-0";
      }
    }
    return "translate-y-0 translate-x-0 opacity-100";
  };

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        getTransformStyles(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
