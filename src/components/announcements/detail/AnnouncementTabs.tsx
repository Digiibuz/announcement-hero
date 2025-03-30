
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnnouncementPreview from "@/components/announcements/AnnouncementPreview";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import { Announcement } from "@/types/announcement";

interface AnnouncementTabsProps {
  announcement: Announcement | null;
  isEditing: boolean;
  isSubmitting: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
  setIsEditing: (value: boolean) => void;
  handleSubmit: (formData: any) => Promise<void>;
}

const AnnouncementTabs: React.FC<AnnouncementTabsProps> = ({
  announcement,
  isEditing,
  isSubmitting,
  activeTab,
  setActiveTab,
  setIsEditing,
  handleSubmit,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="preview">Aperçu</TabsTrigger>
        <TabsTrigger value="edit" disabled={!isEditing}>
          Modifier
          {isEditing && <Pencil className="h-4 w-4 ml-2" />}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        {announcement && (
          <AnnouncementPreview data={{
            title: announcement.title,
            description: announcement.description || "",
            category: announcement.wordpress_category_id || "",
            publishDate: announcement.publish_date ? new Date(announcement.publish_date) : undefined,
            status: announcement.status,
            images: announcement.images || [],
            seoTitle: announcement.seo_title,
            seoDescription: announcement.seo_description,
            seoSlug: announcement.seo_slug,
          }} />
        )}
      </TabsContent>
      <TabsContent value="edit">
        {isEditing && announcement ? (
          <AnnouncementForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsEditing(false);
              setActiveTab("preview");
            }}
          />
        ) : (
          <Alert>
            <AlertDescription>
              Cliquez sur le bouton "Modifier" pour modifier cette annonce.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AnnouncementTabs;
