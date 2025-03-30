
import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "@/types/auth";

export function useImpersonation(currentUser: UserProfile | null) {
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Initialize impersonation state from localStorage if present
  useEffect(() => {
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      try {
        setOriginalUser(JSON.parse(storedOriginalUser));
        setIsImpersonating(true);
      } catch (error) {
        console.error("Error parsing stored original user:", error);
        localStorage.removeItem("originalUser");
      }
    }
  }, []);

  // Function to start impersonating a user
  const impersonateUser = useCallback((userToImpersonate: UserProfile) => {
    // Only allow admins to impersonate
    if (!currentUser || currentUser.role !== "admin") return null;
    
    // Store the original user
    setOriginalUser(currentUser);
    localStorage.setItem("originalUser", JSON.stringify(currentUser));
    setIsImpersonating(true);
    
    return userToImpersonate;
  }, [currentUser]);

  // Function to stop impersonating
  const stopImpersonating = useCallback(() => {
    if (!originalUser) return null;
    
    // Restore the original user
    setIsImpersonating(false);
    
    // Clear impersonation state
    localStorage.removeItem("originalUser");
    const user = originalUser;
    setOriginalUser(null);
    
    return user;
  }, [originalUser]);

  return {
    originalUser,
    isImpersonating,
    impersonateUser,
    stopImpersonating
  };
}
