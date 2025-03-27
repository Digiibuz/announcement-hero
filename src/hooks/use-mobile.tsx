
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Ajout d'une fonction useMediaQuery qui accepte une media query en paramètre
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatch = () => {
      setMatches(media.matches)
    }
    
    // Initialise l'état
    updateMatch()
    
    // Ajoute l'écouteur d'événement
    media.addEventListener("change", updateMatch)
    
    // Nettoie l'écouteur d'événement
    return () => media.removeEventListener("change", updateMatch)
  }, [query])

  return matches
}

