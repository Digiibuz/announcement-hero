
import { useState, useRef } from "react";
import { toast as sonnerToast, type ToastT } from "sonner";

export type ToastProps = React.ComponentProps<typeof sonnerToast>;

export function useToast() {
  const [toasts, setToasts] = useState<ToastT[]>([]);
  
  const toast = (props: string | ToastProps) => {
    if (typeof props === 'string') {
      sonnerToast(props);
    } else {
      sonnerToast(props);
    }
    return props;
  };

  toast.error = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.error(message, options);
  };

  toast.success = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.success(message, options);
  };

  toast.warning = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.warning(message, options);
  };

  toast.info = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.info(message, options);
  };

  return {
    toast,
    toasts: [] // Placeholder pour la compatibilité avec l'API
  };
}

// Exporter directement toast depuis sonner pour l'utiliser sans le hook
export { toast } from "sonner";
