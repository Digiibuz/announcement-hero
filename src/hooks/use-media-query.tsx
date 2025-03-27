
import * as React from "react"

/**
 * Hook that returns whether a media query matches the current viewport
 * @param query CSS media query string
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatch = () => {
      setMatches(media.matches)
    }
    
    // Initialize the state
    updateMatch()
    
    // Add event listener
    media.addEventListener("change", updateMatch)
    
    // Clean up event listener
    return () => media.removeEventListener("change", updateMatch)
  }, [query])

  return matches
}

/**
 * Hook that returns whether the current viewport is mobile (< 768px)
 * @returns boolean indicating if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}

/**
 * Hook that returns whether the current viewport is tablet (768px - 1023px)
 * @returns boolean indicating if viewport is tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)")
}

/**
 * Hook that returns whether the current viewport is desktop (≥ 1024px)
 * @returns boolean indicating if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
