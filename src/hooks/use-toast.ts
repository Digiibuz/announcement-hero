
"use client";

import { toast as sonnerToast, type ToastT } from "sonner";

export type ToastProps = React.ComponentProps<typeof ToastT>;

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
