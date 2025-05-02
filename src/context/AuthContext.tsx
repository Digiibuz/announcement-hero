
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/auth';
import { createProfileFromMetadata } from '@/hooks/useUserProfile';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isOnResetPasswordPage: boolean;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);

  useEffect(() => {
    // Check for reset password page
    try {
      const isResetPasswordPage = window.location.pathname === '/reset-password';
      const hasRecoveryToken = window.location.hash.includes('type=recovery');
      setIsOnResetPasswordPage(isResetPasswordPage && hasRecoveryToken);
    } catch (error) {
      console.error("Error checking reset password page:", error);
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user || null;
      // Convert the plain Supabase User to our UserProfile type
      const userProfile = createProfileFromMetadata(authUser);
      setUser(userProfile);
      setIsLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user || null;
      // Convert the plain Supabase User to our UserProfile type
      const userProfile = createProfileFromMetadata(authUser);
      setUser(userProfile);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (isImpersonating) {
        // If impersonating, go back to original user rather than logging out
        stopImpersonating();
        return;
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setOriginalUser(null);
      setIsImpersonating(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const impersonateUser = (userToImpersonate: UserProfile) => {
    if (!isImpersonating) {
      setOriginalUser(user);
    }
    
    setUser(userToImpersonate);
    setIsImpersonating(true);
  };

  const stopImpersonating = () => {
    if (originalUser) {
      setUser(originalUser);
    }
    
    setOriginalUser(null);
    setIsImpersonating(false);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    login,
    logout,
    isOnResetPasswordPage,
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
