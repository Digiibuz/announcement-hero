
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
      return baseToast(content as ExternalToast);
    },
    // Override specific toast variants
    error: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.error(content, options);
      }
      return baseToast.error(content as ExternalToast);
    },
    success: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.success(content, options);
      }
      return baseToast.success(content as ExternalToast);
    },
    warning: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.warning(content, options);
      }
      return baseToast.warning(content as ExternalToast);
    },
    info: (content: ToastContent, options?: ToastOptions) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.info(content, options);
      }
      return baseToast.info(content as ExternalToast);
    }
  };
};

export const toast = createToast(sonnerToast);

export const useToast = () => {
  return { toast };
};
