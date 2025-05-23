
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Chargement des utilisateurs..." 
}) => (
  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
    <div className="flex justify-center items-center">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      {message}
    </div>
  </div>
);

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "Aucun utilisateur trouvé" 
}) => (
  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
    {message}
  </div>
);
