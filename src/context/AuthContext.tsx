
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
      // Utiliser directement le service auth de Supabase pour obtenir les métadonnées utilisateur
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) {
        return null;
      }
      
      // Créer un profil basé sur les métadonnées utilisateur
      const userProfile: UserProfile = {
        id: authUser.user.id,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || authUser.user.email || '',
        role: (authUser.user.user_metadata?.role as Role) || 'editor',
        clientId: authUser.user.user_metadata?.clientId,
      };
      
      // En second plan (setTimeout pour éviter les boucles de récursion), 
      // essayer de récupérer le profil complet depuis la base de données
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (data && !error) {
            // Mettre à jour le profil avec les données complètes
            setUser({
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as Role,
              clientId: data.client_id,
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil utilisateur en arrière-plan:', error);
        }
      }, 500);
      
      return userProfile;
    } catch (error) {
      console.error('Erreur dans fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Vérifier s'il y a une session d'usurpation d'identité
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      setOriginalUser(JSON.parse(storedOriginalUser));
    }
    
    // Configurer l'écouteur d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        
        if (session?.user) {
          // Utiliser d'abord les métadonnées de l'utilisateur
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // Si le profil n'existe pas mais que l'utilisateur est authentifié
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email || '',
              role: 'editor',
              clientId: null,
            });
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Obtenir la session initiale
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Si le profil n'existe pas mais que l'utilisateur est authentifié
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            role: 'editor',
            clientId: null,
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
      
      // Le profil utilisateur sera défini par l'écouteur onAuthStateChange
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

  // Fonctionnalité d'usurpation d'identité administrateur
  const impersonateUser = (userToImpersonate: UserProfile) => {
    // Autoriser uniquement les administrateurs à usurper l'identité
    if (!user || user.role !== "admin") return;
    
    // Stocker l'utilisateur original
    setOriginalUser(user);
    localStorage.setItem("originalUser", JSON.stringify(user));
    
    // Définir l'utilisateur usurpé
    setUser(userToImpersonate);
  };

  const stopImpersonating = () => {
    if (!originalUser) return;
    
    // Restaurer l'utilisateur original
    setUser(originalUser);
    
    // Effacer l'état d'usurpation d'identité
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
