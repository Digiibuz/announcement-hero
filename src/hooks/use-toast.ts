
import { useState } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastProps = React.ComponentPropsWithoutRef<typeof sonnerToast>;

export function useToast() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toast = ({ ...props }: ToastProps) => {
    sonnerToast(props);
    setIsOpen(true);
  };

  toast.error = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.error(message, options);
    setIsOpen(true);
  };

  toast.success = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.success(message, options);
    setIsOpen(true);
  };

  toast.warning = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.warning(message, options);
    setIsOpen(true);
  };

  toast.info = (message: string, options?: Omit<ToastProps, "children">) => {
    sonnerToast.info(message, options);
    setIsOpen(true);
  };

  return {
    toast,
    isOpen,
  };
}

export { toast } from "sonner";
