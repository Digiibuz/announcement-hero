
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isOnResetPasswordPage: boolean;
  impersonateUser?: () => void;
  stopImpersonating?: () => void;
  originalUser?: any;
  isImpersonating?: boolean;
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
  const [user, setUser] = useState<User | null>(null);
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
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
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
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === 'admin',
    isClient: user?.user_metadata?.role === 'client',
    login,
    logout,
    isOnResetPasswordPage,
    // These are placeholders until you implement proper impersonation
    impersonateUser: () => {},
    stopImpersonating: () => {},
    originalUser: null,
    isImpersonating: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
