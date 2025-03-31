
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";
import { saveSessionData, getSessionData } from "@/utils/cacheStorage";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé de cache pour l'état d'auth entre les onglets
const AUTH_SESSION_KEY = 'auth-session-state';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);

  // Initialize auth state and set up listeners with improved persistence
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setIsLoading(true);
        
        if (session?.user) {
          // First set user from metadata for immediate UI feedback
          const initialProfile = await createProfileFromMetadata(session.user);
          setUserProfile(initialProfile);
          console.log("Initial profile from metadata:", initialProfile);
          
          // Mémoriser l'état d'authentification pour les autres onglets
          await saveSessionData(AUTH_SESSION_KEY, {
            isAuthenticated: true,
            userId: session.user.id,
            timestamp: Date.now()
          });
          
          // Then asynchronously fetch the complete profile
          setTimeout(() => {
            fetchFullProfile(session.user.id).then((success) => {
              if (!success) {
                console.warn("Failed to fetch complete profile, using metadata only");
              }
              setIsLoading(false);
            });
          }, 100);
        } else {
          setUserProfile(null);
          setIsLoading(false);
          
          // Signaler la déconnexion aux autres onglets
          await saveSessionData(AUTH_SESSION_KEY, {
            isAuthenticated: false,
            timestamp: Date.now()
          });
        }
      }
    );

    // Get initial session with improved caching
    const initializeAuth = async () => {
      try {
        // Vérifier s'il y a une session commune entre les onglets
        const cachedSession = await getSessionData<{isAuthenticated: boolean, userId: string, timestamp: number}>(AUTH_SESSION_KEY);
        
        // Utiliser directement la session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Session found during initialization");
          // First set user from metadata
          const initialProfile = await createProfileFromMetadata(session.user);
          setUserProfile(initialProfile);
          
          // Mémoriser l'état d'authentification pour les autres onglets
          await saveSessionData(AUTH_SESSION_KEY, {
            isAuthenticated: true,
            userId: session.user.id,
            timestamp: Date.now()
          });
          
          // Récupérer le profil complet
          setTimeout(() => {
            fetchFullProfile(session.user.id).then((success) => {
              if (success) {
                console.log("Successfully fetched complete profile");
              } else {
                console.warn("Failed to fetch complete profile, using metadata only");
              }
              setIsLoading(false);
            });
          }, 100);
        } else if (cachedSession?.isAuthenticated && cachedSession.userId) {
          // Si pas de session locale mais session dans un autre onglet, on rafraîchit
          console.log("Using cached session from another tab");
          
          // Déclencher un rafraîchissement de la page pour restaurer la session
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } else {
          console.log("No session found during initialization");
          setUserProfile(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setUserProfile(null);
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Écouter les événements de synchronisation entre onglets
  useEffect(() => {
    // Fonction pour gérer les changements de stockage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('app-session-')) {
        console.log("Session data changed in another tab");
        
        if (event.key === `app-session-${AUTH_SESSION_KEY}`) {
          // Rafraîchir l'état d'authentification si nécessaire
          const newValue = event.newValue ? JSON.parse(event.newValue) : null;
          
          if (newValue?.data?.isAuthenticated === false && userProfile) {
            console.log("User logged out in another tab");
            // L'utilisateur s'est déconnecté dans un autre onglet
            setUserProfile(null);
          } else if (newValue?.data?.isAuthenticated === true && !userProfile) {
            console.log("User logged in in another tab");
            // L'utilisateur s'est connecté dans un autre onglet
            window.location.reload();
          }
        }
      }
    };
    
    // Écouter les événements de stockage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userProfile]);

  // Cache the user role when it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userRole', userProfile.role);
      localStorage.setItem('userId', userProfile.id);
      console.log("Cached user role:", userProfile.role);
    } else {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  }, [userProfile?.role, userProfile?.id]);

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
      
      // User will be set by the auth state change listener
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      
      // Signaler la déconnexion aux autres onglets
      await saveSessionData(AUTH_SESSION_KEY, {
        isAuthenticated: false,
        timestamp: Date.now()
      });
      
      await supabase.auth.signOut();
      setUserProfile(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
    }
  };

  const stopImpersonating = () => {
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
    }
  };

  const value: AuthContextType = {
    user: userProfile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
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
