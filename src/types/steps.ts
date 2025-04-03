
export type AnnouncementFormStep = 
  | "category" 
  | "description" 
  | "images" 
  | "seo" 
  | "publishing" 
  | "summary";

export interface StepConfig {
  id: AnnouncementFormStep;
  title: string;
  description: string;
}
