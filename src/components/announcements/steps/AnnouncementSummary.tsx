
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
      {/* Aperçu de la publication sur le site */}
      <Card className={getCardStyles()}>
        <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
          <CardTitle className="text-lg font-medium">Publication sur le site</CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{data.title || "Sans titre"}</h3>
              <Badge variant="secondary" className="mb-3">
                <Tag className="h-3 w-3 mr-1" />
                {categoryName || "Non catégorisé"}
              </Badge>
            </div>
            
            {allMedias.length > 0 && (
              <div>
                <div className="aspect-video rounded-md overflow-hidden bg-muted border mb-3">
                  {isVideoUrl(allMedias[0]) ? (
                    <video className="w-full h-full object-cover">
                      <source src={allMedias[0]} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={allMedias[0]} alt="Image principale" className="w-full h-full object-cover" />
                  )}
                </div>
                {allMedias.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {allMedias.slice(1, 4).map((media, index) => (
                      <div key={index} className="aspect-square rounded-md overflow-hidden bg-muted border relative">
                        {isVideoUrl(media) ? (
                          <video className="w-full h-full object-cover">
                            <source src={media} type="video/mp4" />
                          </video>
                        ) : (
                          <img src={media} alt={`Média ${index + 2}`} className="w-full h-full object-cover" />
                        )}
                        {index === 2 && allMedias.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">+{allMedias.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground whitespace-pre-line">
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
                      className="mt-2 p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent"
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
                "Aucune description"
              )}
            </div>
            
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3 w-3" />
                {data.status === 'draft' && 'Brouillon'}
                {data.status === 'published' && 'Publication immédiate'}
                {data.status === 'scheduled' && data.publishDate && `Programmé pour le ${format(data.publishDate, "PPP")}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu Facebook */}
      {data.createFacebookPost && (
        <Card className={getCardStyles()}>
          <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
            <CardTitle className="text-lg font-medium flex items-center">
              <Share2 className="h-5 w-5 mr-2" />
              Aperçu Facebook
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    E
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Votre Entreprise</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      Maintenant
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 3.314-2.686 6-6 6s-6-2.686-6-6a5.977 5.977 0 01.332-2.027z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </div>
                
                {/* Contenu */}
                <div className="px-4 pb-3">
                  <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                    {data.facebookContent || data.description || "Votre contenu Facebook..."}
                    {data.facebookHashtags && data.facebookHashtags.length > 0 && (
                      <div className="mt-2 text-blue-600">
                        {data.facebookHashtags.map(tag => tag).join(" ")}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Images */}
                {(data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias).length > 0 && (
                  <div className="relative">
                    {(data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias).length === 1 ? (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={(data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias)[0]}
                          alt="Publication"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {(data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias).slice(0, 4).map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-100 relative">
                            <img src={image} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                            {index === 3 && (data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias).length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">
                                  +{(data.facebookImages && data.facebookImages.length > 0 ? data.facebookImages : allMedias).length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Actions */}
                <div className="px-4 py-2 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-600">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">J'aime</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Commenter</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-600">
                      <Share className="w-5 h-5" />
                      <span className="text-sm font-medium">Partager</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu Instagram */}
      {data.createInstagramPost && (
        <Card className={getCardStyles()}>
          <CardHeader className={`${isMobile ? "px-0 py-3" : "pb-3"}`}>
            <CardTitle className="text-lg font-medium flex items-center">
              <Share2 className="h-5 w-5 mr-2" />
              Aperçu Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? "px-0 py-3" : ""}`}>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="bg-white rounded-lg border border-gray-200 max-w-md mx-auto">
                {/* Header */}
                <div className="p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    E
                  </div>
                  <div className="flex-1 text-sm font-semibold">votre_entreprise</div>
                  <MoreHorizontal className="w-5 h-5 text-gray-700" />
                </div>
                
                {/* Image */}
                {(data.instagramImages && data.instagramImages.length > 0 ? data.instagramImages : allMedias)[0] && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={(data.instagramImages && data.instagramImages.length > 0 ? data.instagramImages : allMedias)[0]}
                      alt="Post Instagram"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Actions */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <Heart className="w-6 h-6" />
                      <MessageCircle className="w-6 h-6" />
                      <Share className="w-6 h-6" />
                    </div>
                  </div>
                  
                  {/* Caption */}
                  <div className="text-sm">
                    <span className="font-semibold">votre_entreprise</span>
                    {" "}
                    <span className="text-gray-900">
                      {data.instagramContent || data.description || "Votre contenu Instagram..."}
                    </span>
                    {data.instagramHashtags && data.instagramHashtags.length > 0 && (
                      <div className="mt-1 text-blue-700">
                        {data.instagramHashtags.map(tag => tag).join(" ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnouncementSummary;
