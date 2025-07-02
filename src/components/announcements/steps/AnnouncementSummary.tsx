
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FileImage, FileText, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface AnnouncementSummaryProps {
  data: AnnouncementFormData;
  isMobile?: boolean;
  categoryName?: string;
}

const AnnouncementSummary = ({
  data,
  isMobile,
  categoryName
}: AnnouncementSummaryProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  const truncateText = (text: string, length: number) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  const shouldShowReadMore = (text: string, maxLength: number = 200) => {
    return text && text.length > maxLength;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-4">
        <Card className={getCardStyles()}>
          <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
            <CardTitle className="text-lg font-medium flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Titre</div>
                <div className="text-foreground">{data.title || "Non spécifié"}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <div className="text-foreground whitespace-pre-line">
                  {data.description ? (
                    <>
                      {isDescriptionExpanded ? data.description : truncateText(data.description, 200)}
                      {shouldShowReadMore(data.description) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Lire moins
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Lire plus
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    "Non spécifié"
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Catégorie</div>
                <div className="flex">
                  <Badge variant="secondary" className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryName || "Non spécifié"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardStyles()}>
          <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
            <CardTitle className="text-lg font-medium flex items-center">
              <FileImage className="h-5 w-5 mr-2" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            {data.images && data.images.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.images.map((image, index) => <div key={index} className="aspect-square rounded-md border overflow-hidden bg-muted">
                    <img src={image} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                  </div>)}
              </div> : <div className="text-muted-foreground">Aucune image ajoutée</div>}
          </CardContent>
        </Card>
        
        <Card className={getCardStyles()}>
          <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
            <CardTitle className="text-lg font-medium flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Publication
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Statut</div>
                <div className="text-foreground">
                  {data.status === 'draft' && 'Brouillon'}
                  {data.status === 'published' && 'Publication immédiate'}
                  {data.status === 'scheduled' && 'Publication planifiée'}
                </div>
              </div>
              
              {data.status === 'scheduled' && data.publishDate && <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Date de publication</div>
                  <div className="text-foreground">{format(data.publishDate, "PPP")}</div>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnouncementSummary;
