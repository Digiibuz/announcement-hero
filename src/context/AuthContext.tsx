
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, cleanupAuthState } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContextType, UserProfile, LoginFormValues, Role } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour l'impersonation
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as Role,
        clientId: data.client_id,
        wordpressConfigId: data.wordpress_config_id,
        wordpressConfig: data.wordpress_configs ? {
          name: data.wordpress_configs.name,
          site_url: data.wordpress_configs.site_url
        } : null
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Fonction pour gérer l'initialisation
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Récupérer la session initiale
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Session found, fetching profile...');
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          setIsLoading(false);
        }
      }
    };

    // Initialiser l'authentification
    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, fetching profile...');
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (mounted) {
            setUser(null);
            // Reset impersonation state on logout
            setOriginalUser(null);
            setIsImpersonating(false);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
        toast.success('Connexion réussie');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Reset impersonation state before logout
      setOriginalUser(null);
      setIsImpersonating(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      cleanupAuthState();
      setUser(null);
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const impersonateUser = (userToImpersonate: UserProfile) => {
    if (!user) return;
    
    // Sauvegarder l'utilisateur original s'il n'est pas déjà sauvegardé
    if (!isImpersonating) {
      setOriginalUser(user);
    }
    
    setUser(userToImpersonate);
    setIsImpersonating(true);
  };

  const stopImpersonating = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      setIsImpersonating(false);
      toast.success('Retour à votre compte principal');
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isCommercial = user?.role === 'commercial';

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isClient,
    isCommercial,
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
