
// Ajoutez la propriété wordpress_post_id au type Announcement
export type Announcement = {
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
  wordpress_post_id?: number; // Ajout de l'ID du post WordPress
  publish_date?: string;
  seo_title?: string;
  seo_description?: string;
  seo_slug?: string;
  is_divipixel?: boolean; // Ajout d'un flag pour indiquer si c'est une publication Divipixel
  is_publication?: boolean; // Ajout d'un flag pour indiquer si c'est une publication
};

// Ajout du type WordPressCategory
export type WordPressCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
};
