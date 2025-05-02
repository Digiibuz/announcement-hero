
export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

// Type pour les rôles utilisateur
export type Role = 'admin' | 'editor' | 'client';

// Interface User de Supabase avec nos champs personnalisés
export interface User {
  id: string;
  email: string;
  name?: string; // Ajouté pour compatibilité
  user_metadata: {
    name: string;
    role?: Role;
    wordpressConfigId?: string;
    clientId?: string;
  };
  app_metadata: {
    role?: Role;
    impersonator_id?: string;
  };
  // Ajouté pour compatibilité avec useAuth
  wordpressConfigId?: string;
}

// Interface pour le profil utilisateur 
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
  wordpressConfigId?: string;
  wordpressConfig?: {
    name: string;
    site_url: string;
  };
  lastLogin?: string | null;
}

// Interface pour le profil Google Business
export interface GoogleBusinessProfile {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  gmb_account_id?: string;
  gmb_location_id?: string;
  google_email?: string;
}
