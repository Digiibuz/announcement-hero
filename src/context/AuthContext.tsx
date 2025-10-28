import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/hooks/useImpersonation';
import { UserProfile } from '@/types/auth';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  wordpress_config_id: string | null;
  client_id: string | null;
  can_publish_social_media: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AuthUser extends User {
  wordpressConfigId?: string | null;
  role?: string;
  profile?: Profile;
  name?: string;
  canPublishSocialMedia?: boolean | null;
  wordpressConfig?: {
    name: string;
    site_url: string;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isCommercial: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
}

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Use standard useState hooks
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔍 DEBUG: AuthProvider state:', {
    user: user ? {
      id: user.id,
      email: user.email,
      wordpressConfigId: user.wordpressConfigId,
      role: user.role,
      name: user.name,
      profile: user.profile
    } : null,
    session: !!session,
    isLoading
  });

  // Initialize impersonation
  const {
    originalUser,
    isImpersonating,
    impersonateUser: startImpersonation,
    stopImpersonating: endImpersonation
  } = useImpersonation(user ? {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    role: user.role as any || 'editor'
  } : null);

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

          // Fetch WordPress config if user has one
          let wordpressConfig = null;
          if (profile.wordpress_config_id) {
            const { data: wpConfig } = await supabase
              .from('wordpress_configs')
              .select('name, site_url')
              .eq('id', profile.wordpress_config_id)
              .single();
            
            if (wpConfig) {
              wordpressConfig = wpConfig;
            }
          }

          const updatedUser: AuthUser = {
            ...authUser,
            wordpressConfigId: profile.wordpress_config_id,
            role: profile.role,
            name: profile.name,
            canPublishSocialMedia: profile.can_publish_social_media,
            profile,
            wordpressConfig
          };

          console.log('✅ Updated user object:', {
            id: updatedUser.id,
            wordpressConfigId: updatedUser.wordpressConfigId,
            role: updatedUser.role,
            name: updatedUser.name
          });

          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  // Use standard useEffect hook
  useEffect(() => {
    let isInitialized = false;

    const loadUserProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          return null;
        }

        if (profile) {
          // Fetch WordPress config if user has one
          let wordpressConfig = null;
          if (profile.wordpress_config_id) {
            const { data: wpConfig } = await supabase
              .from('wordpress_configs')
              .select('name, site_url')
              .eq('id', profile.wordpress_config_id)
              .single();
            
            if (wpConfig) {
              wordpressConfig = wpConfig;
            }
          }

          return {
            profile,
            wordpressConfig
          };
        }
        return null;
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        return null;
      }
    };

    const getSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log('📱 Initial session found:', currentSession.user.id);
          setSession(currentSession);
          
          const profileData = await loadUserProfile(currentSession.user.id);
          if (profileData) {
            const updatedUser: AuthUser = {
              ...currentSession.user,
              wordpressConfigId: profileData.profile.wordpress_config_id,
              role: profileData.profile.role,
              name: profileData.profile.name,
              canPublishSocialMedia: profileData.profile.can_publish_social_media,
              profile: profileData.profile,
              wordpressConfig: profileData.wordpressConfig
            };
            setUser(updatedUser);
          }
          isInitialized = true;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔄 Auth state change:', event, newSession?.user?.email);
      
      // Avoid processing events during initial load
      if (!isInitialized && event === 'INITIAL_SESSION') {
        return;
      }
      
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        console.log('✅ User signed in:', newSession.user.id);
        // Defer profile loading to avoid deadlock
        setTimeout(() => {
          loadUserProfile(newSession.user.id).then(profileData => {
            if (profileData) {
              const updatedUser: AuthUser = {
                ...newSession.user,
                wordpressConfigId: profileData.profile.wordpress_config_id,
                role: profileData.profile.role,
                name: profileData.profile.name,
                canPublishSocialMedia: profileData.profile.can_publish_social_media,
                profile: profileData.profile,
                wordpressConfig: profileData.wordpressConfig
              };
              setUser(updatedUser);
            }
          });
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

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

  const logout = signOut;

  const impersonateUser = (userToImpersonate: UserProfile) => {
    const result = startImpersonation(userToImpersonate);
    if (result) {
      // Update current user to impersonated user
      setUser({
        id: userToImpersonate.id,
        email: userToImpersonate.email,
        name: userToImpersonate.name,
        role: userToImpersonate.role,
        wordpressConfigId: userToImpersonate.wordpressConfigId,
        canPublishSocialMedia: userToImpersonate.canPublishSocialMedia,
        wordpressConfig: userToImpersonate.wordpressConfig
      } as AuthUser);
    }
  };

  const stopImpersonating = () => {
    const result = endImpersonation();
    if (result) {
      // Restore original user
      setUser({
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        wordpressConfigId: result.wordpressConfigId,
        wordpressConfig: result.wordpressConfig
      } as AuthUser);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isCommercial = user?.role === 'commercial';

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    isAdmin,
    isClient,
    isCommercial,
    signOut,
    refreshUser,
    login,
    logout,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
