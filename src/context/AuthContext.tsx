
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

type Role = "admin" | "editor";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  impersonateUser: (user: UserProfile) => void;
  stopImpersonating: () => void;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check if there's an impersonation session
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      setOriginalUser(JSON.parse(storedOriginalUser));
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // If profile doesn't exist but user is authenticated
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.name || session.user.email || '',
              role: 'editor',
            });
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // If profile doesn't exist but user is authenticated
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email || '',
            role: 'editor',
          });
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // User profile will be set by the onAuthStateChange listener
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Erreur de connexion");
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOriginalUser(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Admin impersonation functionality
  const impersonateUser = (userToImpersonate: UserProfile) => {
    // Only allow admins to impersonate
    if (!user || user.role !== "admin") return;
    
    // Store original user
    setOriginalUser(user);
    localStorage.setItem("originalUser", JSON.stringify(user));
    
    // Set the impersonated user
    setUser(userToImpersonate);
  };

  const stopImpersonating = () => {
    if (!originalUser) return;
    
    // Restore original user
    setUser(originalUser);
    
    // Clear impersonation state
    setOriginalUser(null);
    localStorage.removeItem("originalUser");
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isEditor: user?.role === "editor",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating: !!originalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
