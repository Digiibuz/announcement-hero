
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, FolderIcon, Clock, Search, Link, Tag, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface AnnouncementPreviewProps {
  data: {
    title: string;
    description: string;
    category: string;
    publishDate: Date | undefined;
    status: string;
    images: string[];
    seoTitle?: string;
    seoDescription?: string;
    seoSlug?: string;
  };
}

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

const AnnouncementPreview = ({ data }: AnnouncementPreviewProps) => {
  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      news: "News",
      events: "Événements",
      blog: "Blog",
      product: "Produits",
    };
    return categories[categoryId] || categoryId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted text-muted-foreground";
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg flex items-center text-sm">
        <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
        <p>Ceci est un aperçu de votre annonce. Elle apparaîtra comme ceci sur votre site WordPress.</p>
      </div>
      
      <Card className="overflow-hidden shadow-md border-muted">
        <CardHeader className="pb-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold leading-tight">
              {data.title || "Titre de l'annonce"}
            </h1>
            <Badge className={getStatusColor(data.status)} variant="outline">
              {data.status === "draft" ? "Brouillon" : 
               data.status === "published" ? "Publié" :
               data.status === "scheduled" ? "Planifié" : 
               data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {data.category && (
              <div className="flex items-center gap-1">
                <Tag size={14} />
                <span>{getCategoryName(data.category)}</span>
              </div>
            )}
            
            {data.publishDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon size={14} />
                <time dateTime={data.publishDate.toISOString()}>
                  {format(data.publishDate, "d MMMM yyyy")}
                </time>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{format(new Date(), "HH:mm")}</span>
            </div>
            
            {data.seoSlug && (
              <div className="flex items-center gap-1">
                <Link size={14} />
                <span className="truncate max-w-[180px]">{data.seoSlug}</span>
              </div>
            )}
          </div>
          
          <Separator />
        </CardHeader>

        <CardContent className="p-6">
          {data.images && data.images.length > 0 ? (
            <div className="mb-6">
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <img
                  src={data.images[0]}
                  alt={data.title || "Image principale de l'annonce"}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {data.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {data.images.slice(1).map((image, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={`Image supplémentaire ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 border border-dashed rounded-md aspect-video flex items-center justify-center text-muted-foreground">
              Aucune image attachée
            </div>
          )}

          {data.description ? (
            <div className="prose prose-sm md:prose-base max-w-none rich-text-editor">
              <div dangerouslySetInnerHTML={{ __html: data.description }} />
            </div>
          ) : (
            <div className="text-muted-foreground italic py-4 text-center">
              Aucune description fournie
            </div>
          )}
          
          {/* SEO Preview */}
          {(data.seoTitle || data.seoDescription) && (
            <div className="mt-8 border rounded-md p-4 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Search size={16} />
                <span>Aperçu SEO Google</span>
              </div>
              
              <div className="text-blue-600 text-lg font-medium truncate seo-preview-text">
                {data.seoTitle || data.title}
              </div>
              <div className="text-green-700 text-sm mb-1 seo-preview-text">
                yoursite.com/annonces/{data.seoSlug || "url-de-lannonce"}
              </div>
              <div className="text-slate-700 text-sm line-clamp-2 seo-preview-text">
                {data.seoDescription || "Aucune méta-description fournie."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementPreview;
