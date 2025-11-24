import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
}

const LoadingOverlay = ({ 
  message = "Chargement en cours...", 
  submessage 
}: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">{message}</p>
            {submessage && (
              <p className="text-sm text-muted-foreground">{submessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
