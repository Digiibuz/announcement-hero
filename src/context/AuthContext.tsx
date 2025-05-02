import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserProfile, Role } from '@/types/auth';

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  isImpersonating: boolean;
  impersonateUser: (user: UserProfile) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  stopImpersonating: () => Promise<void>;
  isOnResetPasswordPage: boolean;
  originalUser: UserProfile | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const supabaseUser = session.user;
          await fetchAndSetUser(supabaseUser);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          await fetchAndSetUser(supabaseUser);
        }
      } else if (event === 'SIGNED_IN') {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          await fetchAndSetUser(supabaseUser);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setOriginalUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
    if (!supabaseUser) {
      setUser(null);
      setUserProfile(null);
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const userWithMetadata: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.name || supabaseUser?.user_metadata?.name as string || 'Unknown User',
        user_metadata: {
          name: profile?.name || supabaseUser?.user_metadata?.name as string || 'Unknown User',
          role: profile?.role as Role || supabaseUser?.user_metadata?.role as Role || 'client',
          wordpressConfigId: profile?.wordpress_config_id || supabaseUser?.user_metadata?.wordpressConfigId as string | undefined,
          clientId: profile?.client_id || supabaseUser?.user_metadata?.clientId as string | undefined,
        },
        app_metadata: {
          role: supabaseUser?.app_metadata?.role as Role | undefined,
          impersonator_id: supabaseUser?.app_metadata?.impersonator_id as string | undefined,
        },
        wordpressConfigId: profile?.wordpress_config_id || supabaseUser?.user_metadata?.wordpressConfigId as string | undefined,
      };
      
      setUser(userWithMetadata);

      // Also create the UserProfile object for components that expect that format
      const userProfile: UserProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.name || supabaseUser?.user_metadata?.name as string || 'Unknown User',
        role: profile?.role as Role || supabaseUser?.user_metadata?.role as Role || 'client',
        wordpressConfigId: profile?.wordpress_config_id || undefined,
        clientId: profile?.client_id || undefined,
        wordpressConfig: profile?.wordpress_configs ? {
          name: profile.wordpress_configs.name,
          site_url: profile.wordpress_configs.site_url
        } : undefined,
        lastLogin: null // Nous n'avons plus accès à cette information sans la fonction Edge
      };
      
      setUserProfile(userProfile);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to fetch user profile.");
      // Fallback to minimal user info if profile fetch fails
      const minimalUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser?.user_metadata?.name as string || 'Unknown User',
        user_metadata: {
          name: supabaseUser?.user_metadata?.name as string || 'Unknown User',
          role: supabaseUser?.user_metadata?.role as Role || 'client',
        },
        app_metadata: {
          role: supabaseUser?.app_metadata?.role as Role | undefined,
          impersonator_id: supabaseUser?.app_metadata?.impersonator_id as string | undefined,
        },
        wordpressConfigId: supabaseUser?.user_metadata?.wordpressConfigId as string | undefined,
      };
      
      setUser(minimalUser);
      
      // Create minimal UserProfile as well
      const minimalUserProfile: UserProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser?.user_metadata?.name as string || 'Unknown User',
        role: supabaseUser?.user_metadata?.role as Role || 'client',
      };
      
      setUserProfile(minimalUserProfile);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await fetchAndSetUser(data.user);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setUserProfile(null);
      setOriginalUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }
      toast.success('Password reset email sent.');
    } catch (error) {
      console.error("Password reset request failed:", error);
      toast.error("Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Refresh user data after profile update
      if (user?.id) {
        const { data: updatedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching updated profile:", profileError);
          toast.error("Failed to fetch updated profile.");
        } else {
          // Update the user context with the new profile data
          const updatedUser: User = {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              name: updatedProfile?.name || user.user_metadata.name,
              // Update other fields as necessary
            },
          };
          setUser(updatedUser);
          toast.success('Profile updated successfully!');
        }
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  const sendPasswordResetEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }
      toast.success('Password reset email sent.');
    } catch (error) {
      console.error("Password reset request failed:", error);
      toast.error("Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const impersonateUser = async (userToImpersonate: UserProfile) => {
    setIsLoading(true);
    try {
      // Keep original user info before impersonating
      setOriginalUser(userProfile);
      
      // Call the Supabase function to set the impersonator_id
      const { data, error } = await supabase.functions.invoke('impersonate', {
        body: {
          user_id: userToImpersonate.id,
        },
      });
  
      if (error) {
        console.error('Impersonation function error:', error);
        toast.error('Failed to impersonate user.');
        return;
      }
  
      if (data && data.access_token) {
        // Update the auth session with the new access token
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
  
        // Fetch and set the impersonated user
         const { data: { user: impersonatedUser } } = await supabase.auth.getUser();
         if (impersonatedUser) {
           await fetchAndSetUser(impersonatedUser);
         }
      } else {
        console.error('Impersonation function response missing access_token:', data);
        toast.error('Failed to impersonate user: Missing access token.');
      }
    } catch (error) {
      console.error('Error during impersonation:', error);
      toast.error('Failed to impersonate user.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopImpersonation = async () => {
    setIsLoading(true);
    try {
      // Call the Supabase function to remove the impersonator_id
      const { data, error } = await supabase.functions.invoke('stop-impersonating');
  
      if (error) {
        console.error('Stop impersonation function error:', error);
        toast.error('Failed to stop impersonation.');
        return;
      }
  
      if (data && data.access_token) {
        // Update the auth session with the new access token
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
  
        // Fetch and set the original user
        const { data: { user: originalSupabaseUser } } = await supabase.auth.getUser();
        if (originalSupabaseUser) {
          await fetchAndSetUser(originalSupabaseUser);
        }
        
        // Clear the original user state
        setOriginalUser(null);
      } else {
        console.error('Stop impersonation function response missing access_token:', data);
        toast.error('Failed to stop impersonation: Missing access token.');
      }
    } catch (error) {
      console.error('Error during stop impersonation:', error);
      toast.error('Failed to stop impersonation.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Alias for backward compatibility
  const stopImpersonating = stopImpersonation;

  // S'assurer que nous accédons correctement aux métadonnées de l'utilisateur
  const contextValue = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.user_metadata?.role === 'admin',
    isEditor: user?.user_metadata?.role === 'editor',
    isClient: user?.user_metadata?.role === 'client',
    login,
    logout,
    resetPassword,
    updateProfile,
    sendPasswordResetEmail,
    isImpersonating: !!user?.app_metadata?.impersonator_id,
    impersonateUser,
    stopImpersonation,
    stopImpersonating,
    originalUser,
    isOnResetPasswordPage: location.pathname === '/reset-password'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
