
import * as React from "react"

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
