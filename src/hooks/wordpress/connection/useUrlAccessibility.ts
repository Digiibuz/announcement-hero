
import { useState } from "react";
import { UrlAccessibilityResult } from "./types";

export const useUrlAccessibility = () => {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Tests the accessibility of a WordPress URL
   */
  const testUrlAccessibility = async (url: string): Promise<UrlAccessibilityResult> => {
    try {
      setIsChecking(true);
      console.log(`Testing accessibility for: ${url}`);
      
      // Normalize the URL (remove double slashes)
      const normalizedUrl = url.replace(/([^:]\/)\/+/g, "$1");
      
      // First attempt: direct fetch
      try {
        const response = await fetch(normalizedUrl, {
          method: 'HEAD',
          mode: 'no-cors', // Bypass CORS for the accessibility test
          cache: 'no-cache',
          headers: {'Accept': 'text/html'},
          referrerPolicy: 'no-referrer',
        });
        
        // If we get here without an error, the URL is accessible
        return { accessible: true };
      } catch (directError: any) {
        console.log("Direct fetch test failed:", directError);
        
        // Check if the error is CORS-related
        if (directError.message.includes('CORS') || directError.name === 'TypeError') {
          // Second attempt with a shorter timeout to detect accessibility issues
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            await fetch(`${normalizedUrl}/wp-json`, {
              method: 'GET',
              mode: 'no-cors',
              signal: controller.signal,
              headers: {'Accept': 'text/html'},
            });
            
            clearTimeout(timeoutId);
            return { accessible: true };
          } catch (timeoutError: any) {
            if (timeoutError.name === 'AbortError') {
              return { 
                accessible: false, 
                error: "Le délai d'attente a expiré lors de la tentative d'accès au site" 
              };
            }
            
            // For other errors, consider that the URL might be accessible
            // but with a CORS problem
            return { 
              accessible: true, 
              error: "L'URL est accessible mais pourrait avoir des restrictions CORS" 
            };
          }
        }
        
        return { 
          accessible: false, 
          error: `Impossible d'accéder à l'URL: ${directError.message}` 
        };
      }
    } catch (error: any) {
      console.error("URL accessibility test error:", error);
      return { 
        accessible: false, 
        error: `Erreur lors du test d'accès: ${error.message}` 
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    testUrlAccessibility
  };
};
