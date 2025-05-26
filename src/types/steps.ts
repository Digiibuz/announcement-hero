
export type AnnouncementFormStep = 
  | "category" 
  | "description" 
  | "images" 
  | "publishing" 
  | "summary";

export interface StepConfig {
  id: AnnouncementFormStep;
  title: string;
  description: string;
}
