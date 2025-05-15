
"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

// We'll use Sonner's ExternalToast type for our options
export type ToastProps = ExternalToast;

export function toast(message: string, options?: ToastProps) {
  return sonnerToast(message, options);
}

toast.success = (message: string, options?: ToastProps) => {
  return sonnerToast.success(message, options);
};

toast.error = (message: string, options?: ToastProps) => {
  return sonnerToast.error(message, options);
};

toast.warning = (message: string, options?: ToastProps) => {
  return sonnerToast.warning(message, options);
};

toast.info = (message: string, options?: ToastProps) => {
  return sonnerToast.info(message, options);
};

export function useToast() {
  return {
    toast,
    isOpen: false
  };
}
