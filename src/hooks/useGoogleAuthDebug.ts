
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGoogleAuthDebug = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [logEntries, setLogEntries] = useState<Array<{
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'warning';
    data?: any;
  }>>([]);

  // Enable debug mode if URL has a debug parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'googleauth' || localStorage.getItem('debug_googleauth') === 'true') {
      setIsDebugMode(true);
      localStorage.setItem('debug_googleauth', 'true');
      console.log('Google Auth Debug Mode: ENABLED');
      
      // Add initial log entry
      addLogEntry('Google Auth Debug Mode activated', 'info', { 
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const addLogEntry = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info', data?: any) => {
    if (!isDebugMode) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      type,
      data
    };
    
    setLogEntries(prev => [entry, ...prev]);
    
    // Also log to console
    switch (type) {
      case 'error':
        console.error(`[Google Auth Debug] ${message}`, data);
        break;
      case 'warning':
        console.warn(`[Google Auth Debug] ${message}`, data);
        break;
      case 'success':
        console.log(`[Google Auth Debug - SUCCESS] ${message}`, data);
        break;
      default:
        console.log(`[Google Auth Debug] ${message}`, data);
    }
  };

  const testGoogleAuth = async () => {
    try {
      addLogEntry('Initiating Google auth test...', 'info');
      
      // Store debug flag to persist through redirects
      localStorage.setItem('debug_googleauth', 'true');
      sessionStorage.setItem('google_auth_debug_test', 'true');
      
      // Set a unique state parameter for this test
      const debugState = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      sessionStorage.setItem('debug_google_auth_state', debugState);
      
      addLogEntry('Starting Google sign-in flow with debug state', 'info', { debugState });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile',
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            state: debugState
          }
        }
      });
      
      if (error) {
        addLogEntry('Error initiating Google auth', 'error', error);
        toast.error('Google auth initialization failed');
        return null;
      }
      
      if (data?.url) {
        addLogEntry('Google auth URL generated, redirecting...', 'success', { 
          url: data.url.substring(0, 50) + '...[truncated]'
        });
        
        // Short delay before redirecting
        setTimeout(() => {
          window.location.href = data.url;
        }, 500);
        
        return data.url;
      } else {
        addLogEntry('No redirect URL received from Supabase', 'error');
        toast.error('Authentication failed: No redirect URL');
        return null;
      }
    } catch (error) {
      addLogEntry('Exception during Google auth test', 'error', error);
      toast.error('Google auth test failed with an exception');
      return null;
    }
  };

  const checkGoogleAuthConfig = async () => {
    try {
      addLogEntry('Checking Google auth configuration...', 'info');
      
      // Create a special function that checks the Google auth configuration
      const response = await supabase.functions.invoke('check-google-auth-config', {
        body: { action: 'validate_config' },
      });
      
      if (response.error) {
        addLogEntry('Error checking Google auth config', 'error', response.error);
        return {
          isValid: false,
          error: response.error.message,
          details: response.error
        };
      }
      
      addLogEntry('Google auth config check completed', 'success', response.data);
      
      return {
        isValid: response.data?.isValid ?? false,
        details: response.data
      };
    } catch (error) {
      addLogEntry('Exception during config check', 'error', error);
      return {
        isValid: false,
        error: 'Exception during configuration check',
        details: error
      };
    }
  };

  return {
    isDebugMode,
    logEntries,
    addLogEntry,
    testGoogleAuth,
    checkGoogleAuthConfig,
    enableDebugMode: () => {
      setIsDebugMode(true);
      localStorage.setItem('debug_googleauth', 'true');
      addLogEntry('Debug mode manually enabled', 'info');
    },
    disableDebugMode: () => {
      setIsDebugMode(false);
      localStorage.removeItem('debug_googleauth');
      sessionStorage.removeItem('google_auth_debug_test');
      sessionStorage.removeItem('debug_google_auth_state');
      console.log('Google Auth Debug Mode: DISABLED');
    }
  };
};
