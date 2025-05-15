
"use client";

import * as React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

// We need to properly type our toast functions
type ToastOptions = Omit<ExternalToast, 'description'>;

// Create a proper wrapper for the sonner toast functions
const createToast = () => {
  // Basic toast function that handles both string/ReactNode and ExternalToast object
  const toast = (
    content: React.ReactNode | Omit<ExternalToast, 'action' | 'cancel' | 'className' | 'description' | 'duration' | 'icon' | 'id' | 'important' | 'onAutoClose' | 'onDismiss' | 'position' | 'promise' | 'style'> & { description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast(content, options);
    }
    // For object-based calls, pass directly to sonnerToast
    return sonnerToast({ ...content } as unknown as string);
  };

  // Error variant
  const error = (
    content: React.ReactNode | Omit<ExternalToast, 'action' | 'cancel' | 'className' | 'description' | 'duration' | 'icon' | 'id' | 'important' | 'onAutoClose' | 'onDismiss' | 'position' | 'promise' | 'style'> & { description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.error(content, options);
    }
    return sonnerToast.error({ ...content } as unknown as string);
  };

  // Success variant
  const success = (
    content: React.ReactNode | Omit<ExternalToast, 'action' | 'cancel' | 'className' | 'description' | 'duration' | 'icon' | 'id' | 'important' | 'onAutoClose' | 'onDismiss' | 'position' | 'promise' | 'style'> & { description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.success(content, options);
    }
    return sonnerToast.success({ ...content } as unknown as string);
  };

  // Warning variant
  const warning = (
    content: React.ReactNode | Omit<ExternalToast, 'action' | 'cancel' | 'className' | 'description' | 'duration' | 'icon' | 'id' | 'important' | 'onAutoClose' | 'onDismiss' | 'position' | 'promise' | 'style'> & { description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.warning(content, options);
    }
    return sonnerToast.warning({ ...content } as unknown as string);
  };

  // Info variant
  const info = (
    content: React.ReactNode | Omit<ExternalToast, 'action' | 'cancel' | 'className' | 'description' | 'duration' | 'icon' | 'id' | 'important' | 'onAutoClose' | 'onDismiss' | 'position' | 'promise' | 'style'> & { description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.info(content, options);
    }
    return sonnerToast.info({ ...content } as unknown as string);
  };

  return {
    ...sonnerToast,
    toast,
    error,
    success,
    warning,
    info,
  };
};

export const toast = createToast();

export const useToast = () => {
  return { toast };
};
