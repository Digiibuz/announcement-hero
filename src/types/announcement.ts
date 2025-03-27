
export interface Announcement {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  updated_at: string;
}
