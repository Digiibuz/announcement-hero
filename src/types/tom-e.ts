
import { CategoryKeyword, Locality } from "@/types/wordpress";
import { DipiCptCategory } from "@/types/announcement";

export interface TomEContent {
  title: string;
  meta_description: string;
  h1: string;
  content: string;
  slug: string;
}

export interface GenerateContentParams {
  configId: string;
  category: string;
  categoryId: string;
  keyword: string;
  locality: string;
}

export interface PublishToWordPressParams {
  configId: string;
  categoryId: string;
  content: TomEContent;
  status?: 'draft' | 'publish' | 'future';
  publishDate?: string;
}

export interface ContentGeneratorProps {
  wordpressConfigId: string;
  categories: DipiCptCategory[];
  localities: Locality[];
  keywords: CategoryKeyword[];
}
