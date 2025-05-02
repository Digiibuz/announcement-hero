
/**
 * Security utilities for authentication processes
 */

// Utility function to silence all console errors
export const silenceAllErrors = () => {
  // Store original console functions
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Completely disable all logs
  console.error = function() {};
  console.warn = function() {};
  console.log = function() {};
  
  // Return a function to restore original functions
  return () => {
    setTimeout(() => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    }, 1000);
  };
};

// Create temporary error handler for blocking events during sensitive operations
export const createTemporaryErrorHandler = () => {
  const handler = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    return true;
  };
  
  return {
    install: () => {
      window.addEventListener('error', handler, true);
      window.addEventListener('unhandledrejection', handler, true);
    },
    remove: () => {
      window.removeEventListener('error', handler, true);
      window.removeEventListener('unhandledrejection', handler, true);
    }
  };
};
