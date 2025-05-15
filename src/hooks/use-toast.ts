
import { toast as sonnerToast } from "sonner";
import { type ToastProps } from "@/components/ui/toast";

export type Toast = ToastProps & {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
};

export const toast = {
  success: (message: string) => {
    return sonnerToast.success(message);
  },
  error: (message: string) => {
    return sonnerToast.error(message);
  },
  warning: (message: string) => {
    return sonnerToast.warning(message);
  },
  info: (message: string) => {
    return sonnerToast.info(message);
  },
  custom: sonnerToast
};

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: toast.error,
    success: toast.success,
    warning: toast.warning,
    info: toast.info,
  };
};
