import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction utilitaire pour afficher les toasts uniquement sur desktop
export const showToast = (options: Parameters<typeof toast>[0]) => {
  // Vérifie si on est sur mobile
  const isMobile = window.innerWidth < 768;
  
  // N'affiche pas les toasts sur mobile
  if (isMobile) {
    return;
  }
  
  toast(options);
}

// Helper pour les toasts de succès
showToast.success = (message: string) => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) return;
  
  toast({
    title: message,
  });
}

// Helper pour les toasts d'erreur
showToast.error = (message: string) => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) return;
  
  toast({
    title: message,
    variant: "destructive",
  });
}
