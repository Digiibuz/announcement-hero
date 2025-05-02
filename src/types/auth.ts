export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

// Étendre l'interface User de Supabase pour inclure nos champs personnalisés
export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role?: string;
    wordpressConfigId?: string;
    clientId?: string;
  };
  app_metadata: {
    role?: string;
    impersonator_id?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId?: string;
  wordpressConfigId?: string;
}
