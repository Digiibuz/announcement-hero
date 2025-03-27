
import { WordPressCategory } from "./announcement";

export interface WordPressConfig {
  id: string;
  name: string;
  site_url: string;
  rest_api_key: string;
  username?: string;
  password?: string;
  app_username?: string;
  app_password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WordPressPage {
  id: number;
  date: string;
  modified: string;
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
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  comment_status: string;
  ping_status: string;
  template: string;
}
