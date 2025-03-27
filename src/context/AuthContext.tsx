
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

  // Fonction séparée pour créer un profil à partir des métadonnées utilisateur
  const createProfileFromMetadata = (authUser: User | null): UserProfile | null => {
    if (!authUser) return null;
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email || '',
      role: (authUser.user_metadata?.role as Role) || 'editor',
      clientId: authUser.user_metadata?.clientId,
    };
  };

  // Fonction pour récupérer le profil complet depuis la base de données
  const fetchFullProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data && !error) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as Role,
          clientId: data.client_id,
        });
      } else if (error) {
        console.error('Erreur lors de la récupération du profil complet:', error);
        // Ne pas modifier l'état de l'utilisateur en cas d'erreur
        // pour ne pas supprimer les métadonnées que nous avons déjà
      }
    } catch (error) {
      console.error('Exception lors de la récupération du profil:', error);
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
          // D'abord définir l'utilisateur à partir des métadonnées
          const initialProfile = createProfileFromMetadata(session.user);
          setUser(initialProfile);
          
          // Ensuite, tenter de récupérer le profil complet de manière asynchrone
          // sans bloquer le flux principal
          setTimeout(() => {
            fetchFullProfile(session.user.id);
          }, 100);
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
        // D'abord définir l'utilisateur à partir des métadonnées
        const initialProfile = createProfileFromMetadata(session.user);
        setUser(initialProfile);
        
        // Ensuite, tenter de récupérer le profil complet de manière asynchrone
        setTimeout(() => {
          fetchFullProfile(session.user.id);
        }, 100);
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
