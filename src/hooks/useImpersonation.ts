
import { useState, useEffect } from "react";
import { UserProfile } from "@/types/auth";

export const useImpersonation = (currentUser: UserProfile | null) => {
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Check if we are already impersonating a user on init
  useEffect(() => {
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      try {
        const parsedOriginalUser = JSON.parse(storedOriginalUser);
        setOriginalUser(parsedOriginalUser);
        setIsImpersonating(true);
      } catch (error) {
        console.error("Error parsing stored original user:", error);
        localStorage.removeItem("originalUser");
      }
    }
  }, []);

  const impersonateUser = (userToImpersonate: UserProfile): UserProfile | null => {
    if (!currentUser) return null;
    
    // Store the current user as the original user
    localStorage.setItem("originalUser", JSON.stringify(currentUser));
    setOriginalUser(currentUser);
    setIsImpersonating(true);
    
    return userToImpersonate;
  };

  const stopImpersonating = (): UserProfile | null => {
    if (!originalUser) return null;
    
    localStorage.removeItem("originalUser");
    setIsImpersonating(false);
    const returnUser = originalUser;
    setOriginalUser(null);
    
    return returnUser;
  };

  return {
    originalUser,
    isImpersonating,
    impersonateUser,
    stopImpersonating
  };
};
