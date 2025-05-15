
"use client";

import * as React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

// Define a type that can handle both ReactNode content and ExternalToast options
type ToastContent = React.ReactNode | ExternalToast;
type ToastOptions = Omit<ExternalToast, 'description'>;

const createToast = (baseToast: typeof sonnerToast) => {
  return {
    ...baseToast,
    // Override default toast method
    toast: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast(content, options);
      }
      // Handle ExternalToast directly - baseToast accepts this directly without type assertion
      return baseToast(content);
    },
    // Override specific toast variants
    error: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.error(content, options);
      }
      // Handle ExternalToast directly - baseToast accepts this directly without type assertion
      return baseToast.error(content);
    },
    success: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.success(content, options);
      }
      // Handle ExternalToast directly - baseToast accepts this directly without type assertion
      return baseToast.success(content);
    },
    warning: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.warning(content, options);
      }
      // Handle ExternalToast directly - baseToast accepts this directly without type assertion
      return baseToast.warning(content);
    },
    info: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.info(content, options);
      }
      // Handle ExternalToast directly - baseToast accepts this directly without type assertion
      return baseToast.info(content);
    }
  };
};

export const toast = createToast(sonnerToast);

export const useToast = () => {
  return { toast };
};
