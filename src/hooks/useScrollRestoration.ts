
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { debounce } from 'lodash';

export function useScrollRestoration(options = { debounceTime: 100 }) {
  const location = useLocation();
  const storageKey = `app_scroll_${location.pathname}`;

  const saveScrollPosition = useCallback(
    debounce(() => {
      const position = {
        x: window.scrollX,
        y: window.scrollY
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch (error) {
        console.warn('Error saving scroll position:', error);
      }
    }, options.debounceTime),
    [storageKey]
  );

  const restoreScrollPosition = useCallback(() => {
    try {
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        const { x, y } = JSON.parse(savedPosition);
        window.scrollTo(x, y);
      }
    } catch (error) {
      console.warn('Error restoring scroll position:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [saveScrollPosition]);

  useEffect(() => {
    restoreScrollPosition();
  }, [location.pathname]);

  return {
    saveScrollPosition,
    restoreScrollPosition
  };
}
