
"use client";

import * as React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

// Définir des types plus précis
type ToastContent = React.ReactNode | string;
type ToastOptions = Omit<ExternalToast, 'description'>;

// Créer un wrapper pour les fonctions toast de sonner
const createToast = () => {
  // Fonction toast de base qui gère les contenus de type string/ReactNode
  const toast = (
    content: ToastContent | { title?: string; description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast(content, options);
    }
    // Pour les appels basés sur un objet, on transmet directement à sonnerToast
    return sonnerToast(content as any);
  };

  // Variante error
  const error = (
    content: ToastContent | { title?: string; description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.error(content, options);
    }
    return sonnerToast.error(content as any);
  };

  // Variante success
  const success = (
    content: ToastContent | { title?: string; description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.success(content, options);
    }
    return sonnerToast.success(content as any);
  };

  // Variante warning
  const warning = (
    content: ToastContent | { title?: string; description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.warning(content, options);
    }
    return sonnerToast.warning(content as any);
  };

  // Variante info
  const info = (
    content: ToastContent | { title?: string; description?: React.ReactNode },
    options?: ToastOptions
  ) => {
    if (typeof content === 'string' || React.isValidElement(content)) {
      return sonnerToast.info(content, options);
    }
    return sonnerToast.info(content as any);
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
