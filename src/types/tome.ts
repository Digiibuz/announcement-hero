
export interface CategoryKeyword {
  id: string;
  wordpress_config_id: string;
  category_id: string;
  category_name: string;
  keyword: string;
  created_at: string;
}

export interface Locality {
  id: string;
  wordpress_config_id: string;
  name: string;
  region: string | null;
  active: boolean;
  created_at: string;
}

export interface TomeGeneration {
  id: string;
  wordpress_config_id: string;
  category_id: string;
  keyword_id: string | null;
  locality_id: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  published_at: string | null;
  wordpress_post_id: number | null;
  title: string | null;
  content: string | null;
  description: string | null;
  error_message: string | null;
  // These are derived properties that can be added at runtime
  wordpress_site_url?: string | null;
  category_name?: string | null;
  keyword_text?: string | null;
  locality_name?: string | null;
  locality_region?: string | null;
}

export interface DipiCptCategory {
  id: string;
  name: string;
  count: number;
  description: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
  link?: string;
}
