
// Types définis pour les annonces

// Type pour les catégories Divi Pixel (dipi_cpt_category)
export interface DipiCptCategory {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
  description?: string;
  link?: string;
  taxonomy?: string;
  parent?: number;
  meta?: any[];
}

// Statut possible pour une annonce
export type AnnouncementStatus = 'draft' | 'published' | 'scheduled';

// Structure d'une annonce
export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  status: AnnouncementStatus;
  images: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  publish_date: string | null;
  wordpress_category_id: string | null;
  wordpress_post_id: number | null;
  is_divipixel: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_slug: string | null;
}

// Structure d'une nouvelle annonce lors de la création
export interface AnnouncementInput {
  title: string;
  description?: string | null;
  status: AnnouncementStatus;
  images?: string[] | null;
  publish_date?: string | null;
  wordpress_category_id?: string | null;
  is_divipixel?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_slug?: string | null;
}

// Structure pour la mise à jour d'une annonce
export interface AnnouncementUpdate {
  title?: string;
  description?: string | null;
  status?: AnnouncementStatus;
  images?: string[] | null;
  publish_date?: string | null;
  wordpress_category_id?: string | null;
  is_divipixel?: boolean;
  wordpress_post_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_slug?: string | null;
}
