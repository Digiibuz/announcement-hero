
"use client";

import { useEffect, useState } from "react";
import { toast as sonnerToast, ToastT } from "sonner";

// Déclarer l'interface globale pour les méthodes toast sur window
declare global {
  interface Window {
    toast: {
      error: (message: string, options?: any) => string | number;
      success: (message: string, options?: any) => string | number;
      info: (message: string, options?: any) => string | number;
      warning: (message: string, options?: any) => string | number;
      promise: <T>(
        promise: Promise<T>, 
        options: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((error: unknown) => string);
        }
      ) => Promise<T>;
      dismiss: (toastId?: string | number) => void;
    };
  }
}

export const useToast = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Initialiser window.toast avec les fonctions toast sonner
    window.toast = {
      error: (message, options) => sonnerToast.error(message, options),
      success: (message, options) => sonnerToast.success(message, options),
      info: (message, options) => sonnerToast.info(message, options),
      warning: (message, options) => sonnerToast.warning(message, options),
      promise: <T>(promise: Promise<T>, options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }) => {
        // Cela doit renvoyer la promesse elle-même pour un typage correct
        sonnerToast.promise(promise, options);
        return promise;
      },
      dismiss: (toastId) => sonnerToast.dismiss(toastId)
    };
  }, []);

  const toast = {
    error: (message: string, options?: any) => {
      if (isMounted) {
        return sonnerToast.error(message, options);
      }
      return "";
    },
    success: (message: string, options?: any) => {
      if (isMounted) {
        return sonnerToast.success(message, options);
      }
      return "";
    },
    info: (message: string, options?: any) => {
      if (isMounted) {
        return sonnerToast.info(message, options);
      }
      return "";
    },
    warning: (message: string, options?: any) => {
      if (isMounted) {
        return sonnerToast.warning(message, options);
      }
      return "";
    },
    promise: <T>(promise: Promise<T>, options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }) => {
      if (isMounted) {
        sonnerToast.promise(promise, options);
      }
      return promise; // Renvoyer la promesse originale pour le chaînage
    },
    dismiss: (toastId?: string | number) => {
      if (isMounted) {
        sonnerToast.dismiss(toastId);
      }
    },
  };

  return toast;
};

// Exporter toast pour une consommation directe
export const toast = {
  error: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.toast) {
      return window.toast.error(message, options);
    }
    return "";
  },
  success: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.toast) {
      return window.toast.success(message, options);
    }
    return "";
  },
  info: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.toast) {
      return window.toast.info(message, options);
    }
    return "";
  },
  warning: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.toast) {
      return window.toast.warning(message, options);
    }
    return "";
  },
  promise: <T>(promise: Promise<T>, options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }) => {
    if (typeof window !== "undefined" && window.toast) {
      window.toast.promise(promise, options);
    }
    return promise; // Renvoyer la promesse originale pour le chaînage
  },
  dismiss: (toastId?: string | number) => {
    if (typeof window !== "undefined" && window.toast) {
      window.toast.dismiss(toastId);
    }
  },
};
