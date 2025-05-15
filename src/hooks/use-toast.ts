
"use client";

import * as React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

// Define toast function variants that accept string or ExternalToast
const createToast = (baseToast: typeof sonnerToast) => {
  return {
    ...baseToast,
    // Override default toast method
    toast: (content: React.ReactNode | ExternalToast, options?: ExternalToast) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast(content, options);
      }
      return baseToast(content);
    },
    // Override specific toast variants
    error: (content: React.ReactNode | ExternalToast, options?: ExternalToast) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.error(content, options);
      }
      return baseToast.error(content as ExternalToast);
    },
    success: (content: React.ReactNode | ExternalToast, options?: ExternalToast) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.success(content, options);
      }
      return baseToast.success(content as ExternalToast);
    },
    warning: (content: React.ReactNode | ExternalToast, options?: ExternalToast) => {
      if (typeof content === 'string' || React.isValidElement(content)) {
        return baseToast.warning(content, options);
      }
      return baseToast.warning(content as ExternalToast);
    },
    info: (content: React.ReactNode | ExternalToast, options?: ExternalToast) => {
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
