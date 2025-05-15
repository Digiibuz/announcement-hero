
import { useToast as useToastSonner } from "sonner";

export const useToast = () => {
  return useToastSonner();
};

export const toast = {
  error: (message: string) => {
    window.toast?.error(message);
  },
  success: (message: string) => {
    window.toast?.success(message);
  },
  warning: (message: string) => {
    window.toast?.warning(message);
  },
  info: (message: string) => {
    window.toast?.info(message);
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return window.toast?.promise(promise, messages);
  },
};

// Augment window interface for global toast access
declare global {
  interface Window {
    toast?: {
      success: (message: string) => void;
      error: (message: string) => void;
      warning: (message: string) => void;
      info: (message: string) => void;
      promise: <T>(
        promise: Promise<T>,
        messages: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((error: unknown) => string);
        }
      ) => Promise<T>;
    };
  }
}
