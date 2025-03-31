
export type DivipixelPublication = {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  status: "draft" | "published" | "scheduled";
  created_at: string;
  updated_at: string;
  user_id: string;
  wordpress_category_id?: string;
  wordpress_category_name?: string;
  wordpress_post_id?: number;
  publish_date?: string;
  seo_title?: string;
  seo_description?: string;
  seo_slug?: string;
};

export type { WordPressCategory } from './announcement';
