
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementFormData } from "../AnnouncementForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FileImage, FileText, Tag, ChevronDown, ChevronUp, Play, Share2, Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
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

  const isVideoUrl = (url: string) => {
    return url.toLowerCase().includes('.mp4') || 
           url.toLowerCase().includes('.webm') || 
           url.toLowerCase().includes('.mov');
  };

  const allMedias = [...(data.images || []), ...(data.additionalMedias || [])];

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
                          onClick={(e) => {
                            e.preventDefault();
                            setIsDescriptionExpanded(!isDescriptionExpanded);
                          }}
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
              Médias {allMedias.length > 0 && `(${allMedias.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            {allMedias.length > 0 ? (
              <div className="space-y-4">
                {/* Image principale */}
                {data.images && data.images.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Image principale</div>
                    <div className="aspect-video rounded-md border overflow-hidden bg-muted">
                      <img src={data.images[0]} alt="Image principale" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Médias additionnels */}
                {data.additionalMedias && data.additionalMedias.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Médias additionnels ({data.additionalMedias.length})
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {data.additionalMedias.map((media, index) => (
                        <div key={index} className="aspect-square rounded-md border overflow-hidden bg-muted relative">
                          {isVideoUrl(media) ? (
                            <>
                              <video className="w-full h-full object-cover">
                                <source src={media} type="video/mp4" />
                              </video>
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="h-8 w-8 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={media} alt={`Média additionnel ${index + 1}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucun média ajouté</div>
            )}
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
              
              {data.status === 'scheduled' && data.publishDate && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Date de publication</div>
                  <div className="text-foreground">{format(data.publishDate, "PPP")}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prévisualisation Facebook si l'utilisateur a choisi de créer un post */}
        {data.createFacebookPost && (
          <Card className={getCardStyles()}>
            <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
              <CardTitle className="text-lg font-medium flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Prévisualisation Facebook
              </CardTitle>
            </CardHeader>
            <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
              {/* Container Facebook avec fond gris */}
              <div className="bg-gray-100 p-4 rounded-lg">
                {/* Post Facebook */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Header du post */}
                  <div className="p-4 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      E
                    </div>
                    
                    {/* Nom et timestamp */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">
                        Votre Entreprise
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        Maintenant
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 3.314-2.686 6-6 6s-6-2.686-6-6a5.977 5.977 0 01.332-2.027z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Menu 3 points */}
                    <div className="w-5 h-5 text-gray-500 cursor-default">
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                  </div>
                  
                  {/* Contenu du post */}
                  <div className="px-4 pb-3">
                    <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                      {data.socialContent || data.description || "Votre contenu apparaîtra ici..."}
                      {data.socialHashtags && data.socialHashtags.length > 0 && (
                        <div className="mt-2 text-blue-600">
                          {data.socialHashtags.map(tag => `#${tag}`).join(" ")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Images */}
                  {allMedias.length > 0 && (
                    <div className="relative">
                      {allMedias.length === 1 ? (
                        <div className="aspect-video bg-gray-100">
                          <img
                            src={allMedias[0]}
                            alt="Publication"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`grid gap-1 ${
                          allMedias.length === 2 ? 'grid-cols-2' : 
                          allMedias.length === 3 ? 'grid-cols-2' : 
                          'grid-cols-2'
                        }`}>
                          {allMedias.slice(0, 4).map((image, index) => (
                            <div key={index} className="aspect-square bg-gray-100 relative">
                              <img
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === 3 && allMedias.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white text-lg font-semibold">
                                    +{allMedias.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-white fill-current" />
                          </div>
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-white fill-current" />
                          </div>
                        </div>
                        <span>12</span>
                      </div>
                      <div className="flex gap-3">
                        <span>3 commentaires</span>
                        <span>2 partages</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700">J'aime</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700">Commenter</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 cursor-default">
                        <Share className="w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700">Partager</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSummary;
