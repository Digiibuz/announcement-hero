
import { toast as sonnerToast } from "sonner";

export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

export const toast = {
  error: (message: string) => {
    window.toast?.error(message);
    sonnerToast.error(message);
  },
  success: (message: string) => {
    window.toast?.success(message);
    sonnerToast.success(message);
  },
  warning: (message: string) => {
    window.toast?.warning(message);
    sonnerToast.warning(message);
  },
  info: (message: string) => {
    window.toast?.info(message);
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
    return window.toast?.promise(promise, messages) || sonnerToast.promise(promise, messages);
  },
};
