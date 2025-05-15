
"use client";

import { toast as sonnerToast } from "sonner";
import { useCallback } from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default", duration = 5000 }: ToastProps) => {
      if (variant === "destructive") {
        sonnerToast.error(title, {
          description,
          duration,
        });
      } else if (variant === "success") {
        sonnerToast.success(title, {
          description,
          duration,
        });
      } else {
        sonnerToast(title, {
          description,
          duration,
        });
      }
    },
    []
  );

  return { toast };
}

// Export a simpler toast function for direct usage
export const toast = {
  // Standard toast
  default: (message: string, options?: any) => {
    sonnerToast(message, options);
  },
  
  // Success toast
  success: (message: string, options?: any) => {
    sonnerToast.success(message, options);
  },
  
  // Error toast
  error: (message: string, options?: any) => {
    sonnerToast.error(message, options);
  },
  
  // Warning toast
  warning: (message: string, options?: any) => {
    sonnerToast.warning(message, options);
  },
  
  // Info toast
  info: (message: string, options?: any) => {
    sonnerToast.info(message, options);
  }
};
