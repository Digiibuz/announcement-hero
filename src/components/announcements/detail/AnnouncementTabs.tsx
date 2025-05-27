
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
  formData?: any;
}

const AnnouncementTabs: React.FC<AnnouncementTabsProps> = ({
  announcement,
  isEditing,
  isSubmitting,
  activeTab,
  setActiveTab,
  setIsEditing,
  handleSubmit,
  formData
}) => {
  const isDraft = announcement?.status === 'draft';
  const isPublished = announcement?.status === 'published';
  
  // Fonction pour gérer le clic sur l'onglet "Modifier"
  const handleEditTabClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    setActiveTab("edit");
    // Mettre à jour sessionStorage
    if (announcement?.id) {
      sessionStorage.setItem(`announcementTab-${announcement.id}`, 'edit');
    }
  };

  // Fonction pour changer d'onglet
  const handleTabChange = (value: string) => {
    if (value === "edit") {
      handleEditTabClick();
    } else {
      setActiveTab(value);
      // Mettre à jour sessionStorage
      if (announcement?.id) {
        sessionStorage.setItem(`announcementTab-${announcement.id}`, value);
      }
    }
  };
  
  // Restaurer l'onglet actif depuis sessionStorage au chargement
  React.useEffect(() => {
    if (announcement?.id) {
      const savedTab = sessionStorage.getItem(`announcementTab-${announcement.id}`);
      if (savedTab && (savedTab === 'preview' || (savedTab === 'edit' && isEditing))) {
        setActiveTab(savedTab);
      }
    }
  }, [announcement?.id, isEditing, setActiveTab]);
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="preview">Aperçu</TabsTrigger>
        <TabsTrigger value="edit">
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
          <>
            {isPublished && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <AlertDescription className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span>
                    Vous modifiez une annonce publiée. Les modifications seront automatiquement synchronisées avec WordPress.
                  </span>
                </AlertDescription>
              </Alert>
            )}
            <AnnouncementForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              initialValues={formData}
              onCancel={() => {
                setIsEditing(false);
                setActiveTab("preview");
                // Mettre à jour sessionStorage
                if (announcement?.id) {
                  sessionStorage.setItem(`announcementTab-${announcement.id}`, 'preview');
                }
              }}
            />
          </>
        ) : (
          <Alert>
            <AlertDescription>
              Mode édition activé. Le formulaire se charge...
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AnnouncementTabs;
