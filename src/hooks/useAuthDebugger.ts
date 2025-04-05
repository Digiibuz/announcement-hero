
// Custom hook for debugging authentication issues
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthDebugger = () => {
  const [authDebugInfo, setAuthDebugInfo] = useState<{
    sessionStatus: string;
    hashParams: Record<string, string>;
    urlParams: Record<string, string>;
    timeChecked: string;
    lastError: string | null;
    callbackDetected: boolean;
  }>({
    sessionStatus: 'Unknown',
    hashParams: {},
    urlParams: {},
    timeChecked: new Date().toISOString(),
    lastError: null,
    callbackDetected: false
  });

  // Parse URL hash fragments into an object
  const parseHashParams = (): Record<string, string> => {
    const hashParams: Record<string, string> = {};
    
    if (!window.location.hash) return hashParams;
    
    // Remove the leading # and split by &
    const hash = window.location.hash.substring(1);
    hash.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        hashParams[key] = decodeURIComponent(value);
      }
    });
    
    return hashParams;
  };

  // Parse URL query parameters into an object
  const parseQueryParams = (): Record<string, string> => {
    const queryParams: Record<string, string> = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
    
    return queryParams;
  };

  // Check for authentication parameters in the URL
  const detectAuthCallback = (): boolean => {
    const hash = window.location.hash;
    const search = window.location.search;
    
    return (
      hash.includes('access_token=') || 
      hash.includes('error=') || 
      search.includes('code=') ||
      search.includes('error=')
    );
  };

  // Check the current session status
  const checkSessionStatus = async (): Promise<string> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return `Active (User: ${data.session.user.id.substring(0, 8)}...)`;
      } else {
        return 'No session found';
      }
    } catch (err) {
      return `Error checking session: ${err}`;
    }
  };

  // Update debug info
  const updateDebugInfo = async () => {
    const hashParams = parseHashParams();
    const urlParams = parseQueryParams();
    const callbackDetected = detectAuthCallback();
    const sessionStatus = await checkSessionStatus();
    
    setAuthDebugInfo({
      sessionStatus,
      hashParams,
      urlParams,
      callbackDetected,
      timeChecked: new Date().toISOString(),
      lastError: null
    });

    // Log debug information to console for easy access
    console.log('Auth Debugger:', {
      url: window.location.href,
      sessionStatus,
      hashParams,
      urlParams,
      callbackDetected,
      timeChecked: new Date().toISOString()
    });
  };

  // Set error information
  const setError = (error: string) => {
    setAuthDebugInfo(prev => ({
      ...prev,
      lastError: error,
      timeChecked: new Date().toISOString()
    }));
    console.error('Auth Error:', error);
  };

  // Initial check
  useEffect(() => {
    updateDebugInfo();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth State Change Event:', event, session ? 'Session exists' : 'No session');
      updateDebugInfo();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    authDebugInfo,
    updateDebugInfo,
    setError
  };
};
