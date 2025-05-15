
import { toast as sonnerToast } from "sonner";

// Add type declaration for the window.toast property
declare global {
  interface Window {
    toast?: {
      error: (message: string) => void;
      success: (message: string) => void;
      warning: (message: string) => void;
      info: (message: string) => void;
      promise: <T>(
        promise: Promise<T>,
        messages: {
          loading: string;
          success: string;
          error: string | ((error: unknown) => string);
        }
      ) => Promise<T>;
    };
  }
}

export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

export const toast = {
  error: (message: string) => {
    if (window.toast?.error) {
      window.toast.error(message);
    }
    sonnerToast.error(message);
  },
  success: (message: string) => {
    if (window.toast?.success) {
      window.toast.success(message);
    }
    sonnerToast.success(message);
  },
  warning: (message: string) => {
    if (window.toast?.warning) {
      window.toast.warning(message);
    }
    sonnerToast.warning(message);
  },
  info: (message: string) => {
    if (window.toast?.info) {
      window.toast.info(message);
    }
    sonnerToast.info(message);
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string | ((error: unknown) => string);
    }
  ) => {
    return (window.toast?.promise?.(promise, messages)) || sonnerToast.promise(promise, messages);
  },
};
