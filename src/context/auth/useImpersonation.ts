
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/auth";
import { createProfileFromMetadata } from "@/hooks/useUserProfile";

export const useImpersonation = (currentUser: User | null) => {
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
    const currentProfile = createProfileFromMetadata(currentUser);
    if (!currentProfile || currentProfile.role !== "admin") return;
    
    // Store the original user
    setOriginalUser(currentProfile);
    localStorage.setItem("originalUser", JSON.stringify(currentProfile));
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
};
