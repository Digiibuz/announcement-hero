
export type AnnouncementFormStep = 
  | "category" 
  | "description" 
  | "images" 
  | "social"
  | "publishing" 
  | "summary";

export interface StepConfig {
  id: AnnouncementFormStep;
  title: string;
  description: string;
}
