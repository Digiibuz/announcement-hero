
export type Role = 'admin' | 'client' | 'commercial' | 'editor';

export interface WordPressConfig {
  name: string;
  site_url: string;
}

export interface GoogleBusinessProfile {
  id: string;
  google_email: string;
  gmb_account_id?: string;
  gmb_location_id?: string;
  access_token?: string;
  refresh_token: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
  wordpressConfigId?: string | null;
  wordpressConfig?: WordPressConfig | null;
  lastLogin?: string | null;
  appVersion?: string | null;
}
