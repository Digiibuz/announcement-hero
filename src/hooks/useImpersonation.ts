
import { useState, useEffect } from "react";
import { UserProfile } from "@/types/auth";

// Define the hook using proper function declaration syntax
export function useImpersonation(currentUser: UserProfile | null) {
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Initialize impersonation state from localStorage if present
  useEffect(() => {
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      setOriginalUser(JSON.parse(storedOriginalUser));
      setIsImpersonating(true);
    }
  }, []);

  // Function to start impersonating a user
  const impersonateUser = (userToImpersonate: UserProfile) => {
    // Only allow admins to impersonate
    if (!currentUser || currentUser.role !== "admin") return;
    
    // Store the original user
    setOriginalUser(currentUser);
    localStorage.setItem("originalUser", JSON.stringify(currentUser));
    setIsImpersonating(true);
    
    return userToImpersonate;
  };

  // Function to stop impersonating
  const stopImpersonating = () => {
    if (!originalUser) return null;
    
    // Restore the original user
    setIsImpersonating(false);
    
    // Clear impersonation state
    localStorage.removeItem("originalUser");
    const user = originalUser;
    setOriginalUser(null);
    
    return user;
  };

  return {
    originalUser,
    isImpersonating,
    impersonateUser,
    stopImpersonating
  };
}
