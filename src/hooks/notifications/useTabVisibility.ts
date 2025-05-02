
import { useState, useCallback } from "react";

/**
 * Hook to track if ticket tab has been viewed
 */
export const useTabVisibility = () => {
  const [viewedTicketTab, setViewedTicketTab] = useState(false);

  // Mark the ticket tab as viewed
  const markTicketTabAsViewed = useCallback(() => {
    setViewedTicketTab(true);
  }, []);

  // Reset view status when leaving the page
  const resetTicketTabView = useCallback(() => {
    setViewedTicketTab(false);
  }, []);

  return {
    viewedTicketTab,
    markTicketTabAsViewed,
    resetTicketTabView
  };
};
