
// Ajoutez la propriété wordpress_post_id au type Announcement
export type Announcement = {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  additionalMedias?: string[]; // Nouveau champ pour les médias additionnels
  status: "draft" | "published" | "scheduled";
  created_at: string;
  updated_at: string;
  user_id: string;
  wordpress_category_id?: string;
  wordpress_category_name?: string;
  wordpress_post_id?: number; // Ajout de l'ID du post WordPress
  wordpress_url?: string; // Ajout de l'URL du post WordPress
  publish_date?: string;
  seo_title?: string;
  seo_description?: string;
  seo_slug?: string;
  // Facebook
  create_facebook_post?: boolean;
  facebook_content?: string;
  facebook_hashtags?: string[];
  facebook_images?: string[];
  facebook_publication_status?: 'pending' | 'success' | 'error';
  facebook_published_at?: string;
  facebook_error_message?: string;
  facebook_post_id?: string;
  facebook_url?: string;
  
  // Instagram
  create_instagram_post?: boolean;
  instagram_content?: string;
  instagram_hashtags?: string[];
  instagram_images?: string[];
  instagram_publication_status?: 'pending' | 'success' | 'error';
  instagram_published_at?: string;
  instagram_error_message?: string;
  instagram_post_id?: string;
  instagram_url?: string;
  
  // AI Instructions
  ai_instructions?: string;
};

// Type pour les catégories WordPress standard
export type WordPressCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
};

// Type pour les catégories personnalisées DipiPixel
export type DipiCptCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
  // Champs supplémentaires spécifiques à la taxonomie personnalisée si nécessaire
};
