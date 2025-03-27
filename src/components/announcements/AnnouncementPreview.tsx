
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, FolderIcon, Clock, Search, Link } from "lucide-react";
import type { AnnouncementFormData } from "./AnnouncementForm";

interface AnnouncementPreviewProps {
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
      events: "Events",
      blog: "Blog",
      product: "Product Updates",
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
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{data.title || "Untitled Announcement"}</h1>
              <Badge className={getStatusColor(data.status)} variant="outline">
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            {data.category && (
              <div className="flex items-center gap-1">
                <FolderIcon size={14} />
                <span>{getCategoryName(data.category)}</span>
              </div>
            )}
            
            {data.publishDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon size={14} />
                <span>{format(data.publishDate, "MMMM d, yyyy")}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{format(new Date(), "h:mm a")}</span>
            </div>
            
            {data.seoSlug && (
              <div className="flex items-center gap-1">
                <Link size={14} />
                <span className="truncate max-w-[180px]">{data.seoSlug}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {data.description ? (
            <div className="prose prose-sm max-w-none">
              {data.description.includes('<') ? 
                // In preview mode, still render HTML properly
                <div dangerouslySetInnerHTML={{ __html: data.description }} />
                : 
                // Plain text
                data.description
              }
            </div>
          ) : (
            <div className="text-muted-foreground italic">
              No description provided
            </div>
          )}

          {data.images && data.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {data.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Announcement image ${index + 1}`}
                  className="rounded-md object-cover w-full h-32"
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 p-8 border border-dashed rounded-md text-center text-muted-foreground">
              No images attached
            </div>
          )}
          
          {/* SEO Preview */}
          {(data.seoTitle || data.seoDescription) && (
            <div className="mt-6 border rounded-md p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <Search size={16} />
                <span>SEO Preview</span>
              </div>
              
              <div className="text-blue-600 text-lg font-medium truncate">
                {data.seoTitle || data.title}
              </div>
              <div className="text-green-700 text-sm mb-1">
                yoursite.com/annonces/{data.seoSlug || "url-de-lannonce"}
              </div>
              <div className="text-slate-700 text-sm line-clamp-2">
                {data.seoDescription || "No meta description provided"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-md">
        <h3 className="text-sm font-medium mb-2">Preview Notes</h3>
        <p className="text-sm text-muted-foreground">
          This is how your announcement will appear on your WordPress site.
          The final appearance may vary slightly based on your Divi theme settings.
        </p>
      </div>
    </div>
  );
};

export default AnnouncementPreview;
