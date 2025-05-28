
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  wordpress_config_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthUser extends User {
  wordpressConfigId?: string | null;
  role?: string;
  profile?: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        console.log('🔍 Refreshing user data for:', authUser.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          return;
        }

        if (profile) {
          console.log('📊 Profile fetched from database:', {
            id: profile.id,
            name: profile.name,
            wordpress_config_id: profile.wordpress_config_id,
            role: profile.role
          });

          const updatedUser: AuthUser = {
            ...authUser,
            wordpressConfigId: profile.wordpress_config_id,
            role: profile.role,
            profile
          };

          console.log('✅ Updated user object:', {
            id: updatedUser.id,
            wordpressConfigId: updatedUser.wordpressConfigId,
            role: updatedUser.role
          });

          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('📱 Initial session found:', currentSession.user.id);
          setSession(currentSession);
          await refreshUser();
        } else {
          console.log('❌ No initial session found');
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.id);
        // Defer profile loading to avoid potential deadlocks
        setTimeout(async () => {
          await refreshUser();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('🎯 Initial session established:', session.user.id);
        setTimeout(async () => {
          await refreshUser();
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      
      // Clear localStorage
      console.log('🧹 Clearing localStorage...');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.includes('announcement') || key.includes('form')) {
          console.log('🗑️ Removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      console.log('🧹 Clearing sessionStorage...');
      Object.keys(sessionStorage || {}).forEach(key => {
        if (key.startsWith('supabase.') || key.includes('announcement') || key.includes('form')) {
          console.log('🗑️ Removing sessionStorage key:', key);
          sessionStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
