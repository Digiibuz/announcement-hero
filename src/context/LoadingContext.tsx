
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Reset loading state when location changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Give components time to load

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
      {isLoading && (
        <LoadingIndicator 
          variant="progress" 
          fullPage={true} 
        />
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
