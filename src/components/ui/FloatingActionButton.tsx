
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps extends ButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

const positionClasses = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
};

const FloatingActionButton = ({
  children,
  position = "bottom-right",
  className,
  showOnMobile = true,
  hideOnDesktop = false,
  ...props
}: FloatingActionButtonProps) => {
  return (
    <Button
      className={cn(
        "fixed shadow-lg z-50",
        positionClasses[position],
        hideOnDesktop && "md:hidden",
        !showOnMobile && "hidden md:flex",
        className
      )}
      size="lg"
      {...props}
    >
      {children}
    </Button>
  );
};

export default FloatingActionButton;
