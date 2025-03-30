
// Ajoutez la propriété wordpress_post_id au type Announcement
export type Announcement = {
  id: string;
  title: string;
  description?: string;
  content?: string; // Pour les pages, nous pouvons utiliser content ou description
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
  is_page?: boolean; // Indique si c'est une page (true) ou une annonce (false/undefined)
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
