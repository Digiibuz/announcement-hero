
export type ConnectionStatus = "connected" | "disconnected" | "checking" | "unknown";

export interface UrlAccessibilityResult {
  accessible: boolean;
  error?: string;
}

export interface ConnectionCheckResult {
  success: boolean;
  message: string;
  details?: string;
  data?: any;
}

export interface WordPressConfigDetails {
  name?: string;
  site_url?: string;
}

export interface WordPressConfig {
  site_url: string;
  rest_api_key: string | null;
  app_username: string | null;
  app_password: string | null;
}
