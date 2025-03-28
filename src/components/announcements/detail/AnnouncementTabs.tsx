
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, FileEdit } from "lucide-react";
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
  const isDraft = announcement?.status === 'draft';
  
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
          <>
            {isDraft && (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <AlertDescription className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  <span>
                    Cette annonce est en mode brouillon. Modifiez-la pour finaliser le contenu avant publication.
                  </span>
                </AlertDescription>
              </Alert>
            )}
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
          </>
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
