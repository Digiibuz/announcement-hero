
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
  wordpress_content_type?: "post" | "page"; // Ajout du type de contenu WordPress
  publish_date?: string;
  seo_title?: string;
  seo_description?: string;
  seo_slug?: string;
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

export type WordPressContentType = "post" | "page";
