
// This file re-exports the auth context from the new location to maintain backward compatibility
import { AuthProvider, useAuth as useAuthOriginal } from './auth/AuthContext';
import { UserProfile } from "@/types/auth";
import { useContext, createContext } from "react";

// Create a wrapper for the auth hook that provides both user and userProfile
const LegacyAuthContext = createContext<any>(undefined);

export const useAuth = () => {
  const auth = useAuthOriginal();
  
  // Return the auth object with an additional 'user' property for backward compatibility
  return {
    ...auth,
    user: auth.userProfile
  };
};

export { AuthProvider };
