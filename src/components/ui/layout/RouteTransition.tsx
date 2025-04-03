
import React, { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";

export const RouteTransition = ({ children }: { children: React.ReactNode }) => {
  const { setLoading } = useLoading();
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only show loader on PUSH navigation (not on back/forward)
    if (navigationType === "PUSH") {
      setLoading(true);
      
      // Hide loader after a short delay
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigationType, setLoading]);

  return <>{children}</>;
};
