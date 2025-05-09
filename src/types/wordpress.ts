
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
  prompt?: string | null;
}

export interface ClientWordPressConfig {
  id: string;
  client_id: string;
  wordpress_config_id: string;
  created_at: string;
}

// Statuts de publication WordPress
export type WordPressPostStatus = "publish" | "draft" | "future" | "pending" | "private";

// WordPress Page type definition for the REST API responses
export interface WordPressPage {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: any[];
  _links: any;
}
