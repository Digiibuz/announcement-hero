
import { lazy, useState } from 'react';

/**
 * Custom lazy loading utility with retry logic
 * @param factory The module factory function
 * @param fallback Optional fallback component to render on failure
 */
export const lazyWithRetry = (factory: () => Promise<any>, fallback: React.ReactNode = null) => {
  const Component = lazy(() => {
    return new Promise((resolve, reject) => {
      // Try importing with retry counter
      const tryImport = (retriesLeft = 2) => {
        factory()
          .then(resolve)
          .catch((error) => {
            // Log error for debugging
            console.error("Module loading error:", error);
            
            // Reject if no more retries
            if (retriesLeft <= 0) {
              console.error("Failed to load module after multiple attempts.");
              reject(error);
              return;
            }
            
            // Retry with exponential backoff
            const delay = Math.pow(2, 3 - retriesLeft) * 1000; // 1s, 2s, 4s...
            console.log(`Retrying module load in ${delay}ms...`);
            
            setTimeout(() => {
              tryImport(retriesLeft - 1);
            }, delay);
          });
      };
      
      // Start the first attempt
      tryImport();
    });
  });
  
  // Return component with error handling
  return (props: any) => {
    const [error, setError] = useState<Error | null>(null);
    
    if (error && !fallback) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <div className="rounded-lg border p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Loading Error</h2>
            <p className="mb-4 text-muted-foreground">
              Unable to load this page. This may be due to an unstable internet connection.
            </p>
            <button 
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    if (error && fallback) {
      return <>{fallback}</>;
    }
    
    try {
      return (
        <Component {...props} />
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      return null;
    }
  };
};
