
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useReadStatus } from "./useReadStatus";
import { useUnreadCounter } from "./useUnreadCounter";
import { useRealtimeNotifications } from "./useRealtimeNotifications";
import { useTabVisibility } from "./useTabVisibility";

/**
 * Main hook for ticket notifications management
 */
export const useTicketNotifications = () => {
  const { user } = useAuth();
  const { readTicketIds, markTicketAsRead } = useReadStatus();
  const { calculateUnreadCount } = useUnreadCounter(readTicketIds);
  const [unreadCount, setUnreadCount] = useState(0);
  const { viewedTicketTab, markTicketTabAsViewed, resetTicketTabView } = useTabVisibility();

  // Update unread count when dependencies change
  const updateUnreadCount = useCallback(() => {
    setUnreadCount(calculateUnreadCount());
  }, [calculateUnreadCount]);

  // Initialize unread count
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Set up realtime listeners
  useRealtimeNotifications(user?.id, updateUnreadCount);

  return {
    unreadCount,
    markTicketAsRead,
    markTicketTabAsViewed,
    resetTicketTabView,
    readTicketIds
  };
};
