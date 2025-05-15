
"use client";

import { toast as sonnerToast } from "sonner";

// Define the shape of our toast methods
type ToastType = {
  success: (message: string, options?: object) => void;
  error: (message: string, options?: object) => void;
  info: (message: string, options?: object) => void;
  warning: (message: string, options?: object) => void;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => Promise<T>;
};

// Create a type safe hook that accesses either window.toast or sonner
export const useToast = (): ToastType => {
  return {
    success: (message: string, options = {}) => sonnerToast.success(message, options),
    error: (message: string, options = {}) => sonnerToast.error(message, options),
    info: (message: string, options = {}) => sonnerToast.info(message, options),
    warning: (message: string, options = {}) => sonnerToast.warning(message, options),
    promise: <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => sonnerToast.promise(promise, options)
  };
};

// Make toast accessible both as a hook and as a direct import
export const toast: ToastType = {
  success: (message: string, options = {}) => sonnerToast.success(message, options),
  error: (message: string, options = {}) => sonnerToast.error(message, options),
  info: (message: string, options = {}) => sonnerToast.info(message, options), 
  warning: (message: string, options = {}) => sonnerToast.warning(message, options),
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => sonnerToast.promise(promise, options)
};
