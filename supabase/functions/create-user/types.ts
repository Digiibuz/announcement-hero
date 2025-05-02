
/**
 * Types for the create-user function
 */

export interface RequestData {
  email: string;
  password: string;
  name: string;
  role: string;
  wordpressConfigId?: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
  details?: string;
  stack?: string;
  authUser?: string;
  profileExists?: boolean;
  profileId?: string;
}

export interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  wordpress_config_id: string | null;
  updated_at?: Date;
}
