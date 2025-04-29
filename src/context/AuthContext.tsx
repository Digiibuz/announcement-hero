import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
import { useSupabaseConfig } from "./SupabaseConfigContext";
import { setSupabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Définition des types pour le contexte
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isOnResetPasswordPage: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// Définition des types pour les rôles
type Role = 'admin' | 'client' | 'user';

// Fonction utilitaire pour déterminer si un utilisateur a un rôle spécifique
const hasRole = (user: User | null, role: Role): boolean => {
  if (!user) return false;
  return user.app_metadata?.roles?.includes(role) ?? false;
};

// Création du contexte avec des valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  isClient: false,
  isOnResetPasswordPage: false,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

// Provider qui encapsule la logique d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(location.pathname.includes('reset-password'));

  // Accès au client Supabase via le contexte de configuration
  const { client: supabase, isLoading: isConfigLoading, error: configError } = useSupabaseConfig();

  // Mise à jour du singleton Supabase quand le client est prêt
  useEffect(() => {
    if (supabase) {
      setSupabaseClient(supabase);
    }
  }, [supabase]);

  // Détermine si l'utilisateur est un administrateur
  const isAdmin = React.useMemo(() => hasRole(user, 'admin'), [user]);

  // Détermine si l'utilisateur est un client
  const isClient = React.useMemo(() => hasRole(user, 'client'), [user]);

  // Chargement de l'utilisateur actuel et de la session
  useEffect(() => {
    // Ne pas tenter de charger l'utilisateur si le client Supabase n'est pas prêt
    if (!supabase) {
      return;
    }

    setIsLoading(true);

    // Définir le gestionnaire d'événements pour les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        console.log("Utilisateur connecté:", session?.user);
        setUser(session?.user || null);
        setSession(session || null);
      } else if (event === "SIGNED_OUT") {
        console.log("Utilisateur déconnecté");
        setUser(null);
        setSession(null);
        navigate('/login');
      } else if (event === "USER_UPDATED") {
        console.log("Profil utilisateur mis à jour:", session?.user);
        setUser(session?.user || null);
        setSession(session || null);
      } else if (event === "PASSWORD_RECOVERY") {
        console.log("Récupération de mot de passe initiée");
        setIsOnResetPasswordPage(true);
      }
    });

    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setSession(session || null);
    }).finally(() => {
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, location.pathname, navigate]); // Dépendance sur supabase pour réexécuter quand le client est prêt

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Erreur de connexion:", error);
      throw new Error(error.message);
    }

    console.log("Connexion réussie:", data);
    setUser(data.user);
    setSession(data.session);
  };

  // Fonction de déconnexion
  const logout = async () => {
    if (!supabase) throw new Error("Client Supabase non initialisé");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erreur de déconnexion:", error);
      throw new Error(error.message);
    }

    console.log("Déconnexion réussie");
    setUser(null);
    setSession(null);
  };

  // Fonction de réinitialisation du mot de passe
  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Erreur de réinitialisation du mot de passe:", error);
      throw new Error(error.message);
    }

    console.log("Demande de réinitialisation envoyée:", data);
    toast.success("Un email de réinitialisation a été envoyé.");
  };

  // Fonction de mise à jour du mot de passe
  const updatePassword = async (newPassword: string) => {
    if (!supabase) throw new Error("Client Supabase non initialisé");
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Erreur de mise à jour du mot de passe:", error);
      throw new Error(error.message);
    }

    console.log("Mot de passe mis à jour:", data);
    toast.success("Mot de passe mis à jour avec succès.");
  };

  // Détermine si l'utilisateur est authentifié
  const isAuthenticated = React.useMemo(() => {
    return !!user && !!session;
  }, [user, session]);

  // Rendu du provider
  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading: isLoading || isConfigLoading, // Inclure le chargement de la config
      isAuthenticated,
      isAdmin,
      isClient,
      isOnResetPasswordPage,
      login,
      logout,
      resetPassword,
      updatePassword
    }}>
      {/* Afficher un chargement si la configuration Supabase est en cours de chargement */}
      {isConfigLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <LoadingIndicator variant="dots" size={42} />
          <p className="mt-4 text-center text-muted-foreground">
            Initialisation de la configuration...
          </p>
        </div>
      ) : configError ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <div className="rounded-lg border p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Erreur de configuration</h2>
            <p className="mb-4 text-muted-foreground">
              {configError.message || "Impossible de charger la configuration Supabase."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};
