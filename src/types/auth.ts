
export type Role = 'admin' | 'client' | 'commercial';

export interface WordPressConfig {
  name: string;
  site_url: string;
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
