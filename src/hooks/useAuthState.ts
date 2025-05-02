
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/auth";

// Timeout for the requests to Supabase (in ms)
const REQUEST_TIMEOUT = 15000;

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);

  // Function to check network connectivity
  const checkNetworkConnectivity = useCallback(() => {
    return window.navigator.onLine;
  }, []);

  // Check if we are on the password reset page
  useEffect(() => {
    // Check if we are on the reset password page AND if we have tokens in the URL
    const isResetPasswordPage = window.location.pathname === '/reset-password';
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    
    setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    console.log("Is on reset password page:", isResetPasswordPage, "Has recovery token:", hasRecoveryToken);
  }, [window.location.pathname, window.location.hash]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setNetworkError(false);
      if (reconnectAttempts > 0) {
        console.log("Network connection restored");
        setReconnectAttempts(0);
      }
    };

    const handleOffline = () => {
      setNetworkError(true);
      console.log("Network connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnectAttempts]);

  return {
    isLoading,
    setIsLoading,
    networkError, 
    setNetworkError,
    reconnectAttempts,
    setReconnectAttempts,
    isOnResetPasswordPage,
    checkNetworkConnectivity,
    REQUEST_TIMEOUT
  };
};
