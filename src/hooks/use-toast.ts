
// This file exists to provide a central place for toast configuration and usage
import { toast as sonnerToast } from "sonner";

// Create a toast hook to match the interface expected by the application
export function useToast() {
  return {
    toast: sonnerToast
  };
}

// Also export the toast function directly for convenience
export const toast = sonnerToast;
