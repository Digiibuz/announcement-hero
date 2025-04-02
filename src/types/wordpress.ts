export interface WordPressConfig {
  id: string;
  name: string;
  site_url: string;
  username?: string; 
  password?: string;
  app_username?: string;
  app_password?: string;
  rest_api_key?: string;
  created_at: string;
  updated_at: string;
  prompt?: string; // Ajout du champ prompt
}

export interface ClientWordPressConfig {
  id: string;
  client_id: string;
  wordpress_config_id: string;
  created_at: string;
}
