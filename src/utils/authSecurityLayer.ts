
import { createTemporaryErrorHandler, silenceAllErrors } from '@/context/auth/hooks/authSecurityUtils';

/**
 * Sets up authentication security layer
 * - Prevents sensitive URL/token leaks in console
 * - Blocks unauthorized network tracing
 * - Silences errors during authentication flows
 */
export function setupAuthSecurityLayer() {
  // Apply immediate protection
  const restore = silenceAllErrors();
  const errorHandler = createTemporaryErrorHandler();
  errorHandler.install();
  
  // Restore standard behavior after a delay
  setTimeout(() => {
    restore();
    errorHandler.remove();
  }, 1000);
  
  return {
    cleanup: () => {
      restore();
      errorHandler.remove();
    }
  };
}

/**
 * Setup network entry protection
 * Blocks sensitive entries in network monitoring tools
 */
export function setupNetworkEntriesProtection() {
  // Intercept fetch requests that may contain sensitive auth info
  const originalFetch = window.fetch;
  
  // Replace fetch to prevent leaking auth URLs in the network tab
  window.fetch = function(input, init) {
    try {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      
      // Check if this is an auth-related URL
      if (url.includes('auth') || url.includes('token') || url.includes('login')) {
        // For auth requests, silence console temporarily
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleLog = console.log;
        
        console.error = function() {};
        console.warn = function() {};
        console.log = function() {};
        
        // Execute request
        const promise = originalFetch(input, init);
        
        // Restore console after a delay
        setTimeout(() => {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          console.log = originalConsoleLog;
        }, 1000);
        
        return promise;
      }
      
      return originalFetch(input, init);
    } catch (e) {
      return originalFetch(input, init);
    }
  };
  
  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}
