
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
  create_facebook_post?: boolean; // Nouveau champ pour la publication Facebook
  social_content?: string; // Contenu optimisé pour les réseaux sociaux
  social_hashtags?: string[]; // Hashtags pour les réseaux sociaux
  facebook_publication_status?: 'pending' | 'success' | 'error'; // Statut de publication Facebook
  facebook_published_at?: string; // Date de publication Facebook
  facebook_error_message?: string; // Message d'erreur Facebook
  facebook_post_id?: string; // ID du post Facebook
  facebook_url?: string; // URL du post Facebook
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
