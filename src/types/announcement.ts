
export interface Announcement {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  updated_at: string;
  publish_date?: string;
  wordpress_category_id?: string;
  wordpress_category_name?: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
}
