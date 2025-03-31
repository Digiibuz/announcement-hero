
import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Initial check
    const updateMatch = () => {
      setMatches(media.matches);
    };
    
    // Set the initial value
    updateMatch();
    
    // Set up the listener for changes
    media.addEventListener("change", updateMatch);
    
    // Clean up the listener
    return () => {
      media.removeEventListener("change", updateMatch);
    };
  }, [query]);

  return matches;
}

// Add the useIsMobile hook that was missing
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}
