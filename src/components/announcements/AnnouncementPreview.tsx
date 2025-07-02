
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, FolderIcon, Clock, Search, Link, Tag, AlertCircle, Play } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface AnnouncementPreviewProps {
  data: {
    title: string;
    description: string;
    category: string;
    publishDate: Date | undefined;
    status: string;
    images: string[];
    additionalMedias?: string[];
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

  const isVideoUrl = (url: string) => {
    return url.toLowerCase().includes('.mp4') || 
           url.toLowerCase().includes('.webm') || 
           url.toLowerCase().includes('.mov');
  };

  const allMedias = [...(data.images || []), ...(data.additionalMedias || [])];

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
          {/* Image principale */}
          {data.images && data.images.length > 0 ? (
            <div className="mb-6">
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <img
                  src={data.images[0]}
                  alt={data.title || "Image principale de l'annonce"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="mb-6 border border-dashed rounded-md aspect-video flex items-center justify-center text-muted-foreground">
              Aucune image principale
            </div>
          )}

          {/* Contenu principal */}
          {data.description ? (
            <div className="prose prose-sm md:prose-base max-w-none rich-text-editor mb-8">
              <div dangerouslySetInnerHTML={{ __html: data.description }} />
            </div>
          ) : (
            <div className="text-muted-foreground italic py-4 text-center mb-8">
              Aucune description fournie
            </div>
          )}

          {/* Médias additionnels */}
          {data.additionalMedias && data.additionalMedias.length > 0 && (
            <div className="mt-8 pt-6 border-t border-muted">
              <h3 className="text-lg font-medium mb-4">Médias additionnels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.additionalMedias.map((media, index) => (
                  <div key={index} className="rounded-md overflow-hidden bg-muted border">
                    {isVideoUrl(media) ? (
                      <div className="relative aspect-video">
                        <video controls className="w-full h-full object-cover">
                          <source src={media} type="video/mp4" />
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      </div>
                    ) : (
                      <div className="aspect-video">
                        <img
                          src={media}
                          alt={`Média additionnel ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* SEO Preview */}
          {(data.seoTitle || data.seoDescription) && (
            <div className="mt-8 border rounded-md p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <Search size={16} />
                <span>Aperçu SEO Google</span>
              </div>
              
              <div className="text-blue-600 text-lg font-medium truncate">
                {data.seoTitle || data.title}
              </div>
              <div className="text-green-700 text-sm mb-1">
                yoursite.com/annonces/{data.seoSlug || "url-de-lannonce"}
              </div>
              <div className="text-slate-700 text-sm line-clamp-2">
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
