
export interface WordPressConfig {
  id: string;
  name: string;
  site_url: string;
  rest_api_key: string | null;
  app_username: string | null;
  app_password: string | null;
  username: string | null;
  password: string | null;
  created_at: string;
  updated_at: string;
  endpoint_type?: string;
  endpoint_checked_at?: string;
}

// Statuts de publication WordPress
export type WordPressPostStatus = "publish" | "draft" | "future" | "pending" | "private";
