
"use client"

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Define listener function
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Add listener
    media.addEventListener("change", updateMatches);
    
    // Cleanup
    return () => {
      media.removeEventListener("change", updateMatches);
    };
  }, [query]);

  return matches;
}

/**
 * Hook that returns whether the current viewport is mobile (< 768px)
 * @returns boolean indicating if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * Hook that returns whether the current viewport is tablet (768px - 1023px)
 * @returns boolean indicating if viewport is tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/**
 * Hook that returns whether the current viewport is desktop (≥ 1024px)
 * @returns boolean indicating if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
