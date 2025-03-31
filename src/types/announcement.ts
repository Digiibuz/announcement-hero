
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
  is_divipixel?: boolean; // Ajout du marqueur pour différencier les types de contenus
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

// Ajout d'un type pour les pages DiviPixel
export type DiviPixelPage = {
  id: string;
  title: string;
  organization_pixels?: Record<string, any>; // Structure JSON pour l'organisation des pixels
  components_used?: Record<string, any>[]; // Liste des composants utilisés
  meta_description?: string;
  status: "draft" | "published" | "scheduled";
  created_at: string;
  updated_at: string;
  user_id: string;
  wordpress_category_id?: string;
  wordpress_post_id?: number;
  publish_date?: string;
  seo_title?: string;
  seo_slug?: string;
};
