import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
}

const LoadingOverlay = ({ 
  message, 
  submessage 
}: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="animate-fade-in">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    </div>
  );
};

export default LoadingOverlay;
