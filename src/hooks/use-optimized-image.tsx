
import { useState, useEffect } from 'react';

interface UseOptimizedImageProps {
  src: string;
  lowQualitySrc?: string;
  placeholderSrc?: string;
  sizes?: string;
  quality?: 'low' | 'medium' | 'high';
  lazyLoad?: boolean;
}

export function useOptimizedImage({
  src,
  lowQualitySrc,
  placeholderSrc = '/placeholder.svg',
  sizes = '100vw',
  quality = 'medium',
  lazyLoad = true
}: UseOptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    // Si réseau lent et image basse qualité disponible, commencer avec celle-ci
    window.isOnSlowNetwork && window.isOnSlowNetwork() && lowQualitySrc 
      ? lowQualitySrc 
      : placeholderSrc
  );
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState<boolean>(!lazyLoad);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      setCurrentSrc(placeholderSrc);
      return;
    }

    // Observer pour le lazy loading
    let observer: IntersectionObserver | null = null;
    
    if (lazyLoad) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer?.disconnect();
        }
      }, {
        rootMargin: '200px', // Précharger avant qu'elle soit visible
        threshold: 0.01
      });
      
      const imgElement = document.querySelector(`[data-src="${src}"]`);
      if (imgElement) {
        observer.observe(imgElement);
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, lazyLoad, placeholderSrc]);

  useEffect(() => {
    // Ne pas charger l'image si elle n'est pas visible (lazy loading)
    if (!isVisible) return;
    
    // Déterminer si nous sommes sur un réseau lent
    const isSlowConnection = window.isOnSlowNetwork && window.isOnSlowNetwork();
    const isSaveData = window.isSaveDataEnabled && window.isSaveDataEnabled();
    
    // Pour les réseaux très lents ou en mode économie de données, 
    // utiliser l'image basse qualité si disponible
    if ((isSlowConnection || isSaveData) && lowQualitySrc) {
      const img = new Image();
      img.src = lowQualitySrc;
      
      img.onload = () => {
        setCurrentSrc(lowQualitySrc);
        setStatus('loaded');
        
        // Charger la version haute qualité en arrière-plan
        // seulement si nous ne sommes pas en mode économie de données
        if (!isSaveData) {
          const highQualityImg = new Image();
          highQualityImg.src = src;
          highQualityImg.onload = () => {
            setCurrentSrc(src);
          };
        }
      };
      
      img.onerror = () => {
        // Fallback to original image if low quality fails
        loadOriginalImage();
      };
    } else {
      // Charger directement l'image originale pour les connexions normales
      loadOriginalImage();
    }
    
    function loadOriginalImage() {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setCurrentSrc(src);
        setStatus('loaded');
      };
      
      img.onerror = () => {
        setCurrentSrc(placeholderSrc);
        setStatus('error');
      };
    }
  }, [src, lowQualitySrc, placeholderSrc, isVisible]);

  // Calculer le srcSet optimal en fonction de la qualité demandée
  const getSrcSet = () => {
    if (!src || status === 'error') return undefined;
    
    // Extraire l'extension
    const lastDot = src.lastIndexOf('.');
    const ext = lastDot !== -1 ? src.substring(lastDot) : '';
    const baseSrc = lastDot !== -1 ? src.substring(0, lastDot) : src;
    
    // Si l'URL est déjà une URL de Supabase Storage, ne pas tenter de créer un srcSet
    if (src.includes('supabase.co/storage/v1/object') || src.includes('storage.googleapis.com')) {
      return undefined;
    }
    
    // Pour les réseaux lents ou en mode économie de données, limiter les tailles
    if (window.isOnSlowNetwork && window.isOnSlowNetwork()) {
      if (quality === 'low') {
        return `${baseSrc}-small${ext} 400w`;
      }
      return `${baseSrc}-small${ext} 400w, ${baseSrc}-medium${ext} 800w`;
    }
    
    // Génération standard selon la qualité
    switch (quality) {
      case 'low':
        return `${baseSrc}-small${ext} 400w`;
      case 'medium':
        return `${baseSrc}-small${ext} 400w, ${baseSrc}-medium${ext} 800w, ${src} 1200w`;
      case 'high':
        return `${baseSrc}-small${ext} 400w, ${baseSrc}-medium${ext} 800w, ${src} 1200w, ${baseSrc}-large${ext} 2000w`;
      default:
        return undefined;
    }
  };

  return {
    src: currentSrc,
    srcSet: getSrcSet(),
    sizes,
    status,
    isLoading: status === 'loading',
    isLoaded: status === 'loaded',
    isError: status === 'error',
    // Props à passer à un élément img
    imgProps: {
      src: currentSrc,
      srcSet: getSrcSet(),
      sizes,
      loading: lazyLoad ? 'lazy' : undefined,
      // Pour le tracking dans l'Observer
      'data-src': src,
      // Pour les performances de rendu
      decoding: "async" as "async" | "auto" | "sync",
      // Style de transition pour les images
      style: {
        transition: 'opacity 0.3s ease-in-out',
        opacity: status === 'loaded' ? 1 : 0.5
      }
    }
  };
}
