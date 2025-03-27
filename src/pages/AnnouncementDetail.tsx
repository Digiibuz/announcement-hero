
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CalendarClock, 
  ArrowLeft, 
  ImageIcon,
  Tag,
  MessageSquareText,
} from "lucide-react";
import { Announcement } from "@/types/announcement";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { Skeleton } from "@/components/ui/skeleton";

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { categories } = useWordPressCategories();

  // Fetch announcement from Supabase
  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      if (!id) return null;

      let query = supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();
      
      // If not admin, only allow viewing own announcements
      if (!isAdmin) {
        query = query.eq("user_id", user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Object not found or permission denied
          toast.error("Vous n'avez pas accès à cette annonce ou elle n'existe pas");
          navigate("/announcements");
          return null;
        }
        toast.error("Erreur lors du chargement de l'annonce: " + error.message);
        return null;
      }
      
      // Map WordPress category ID to name
      if (data.wordpress_category_id && categories) {
        const category = categories.find(
          c => c.id.toString() === data.wordpress_category_id
        );
        
        if (category) {
          return {
            ...data,
            wordpress_category_name: category.name
          };
        }
      }
        
      return data as Announcement;
    },
    enabled: !!id && !!user,
  });

  // Function to get the public URL for an image
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    // Handle both full URLs and storage paths
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const { data } = supabase.storage.from('images').getPublicUrl(imagePath);
    return data.publicUrl;
  };

  // Function to count words in a text
  const countWords = (text: string | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Publié</Badge>;
      case "draft":
        return <Badge variant="outline">Brouillon</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Programmé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Go back to announcements list
  const handleGoBack = () => {
    navigate("/announcements");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <Button 
              variant="ghost" 
              onClick={handleGoBack} 
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux annonces
            </Button>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : announcement ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-3xl font-bold">{announcement.title}</h1>
                  {getStatusBadge(announcement.status)}
                </div>

                {/* Image Gallery */}
                {announcement.images && announcement.images.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
                        <img 
                          src={getImageUrl(announcement.images[0])} 
                          alt={announcement.title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            console.error("Image loading error:", e);
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aucune image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AspectRatio ratio={16/9} className="bg-muted/40 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-muted/50" />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium mr-2">Date de création:</span>
                        <span className="text-sm">
                          {format(new Date(announcement.created_at), "dd MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      
                      {announcement.publish_date && (
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium mr-2">Date de publication:</span>
                          <span className="text-sm">
                            {format(new Date(announcement.publish_date), "dd MMMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      )}

                      {announcement.wordpress_category_name && (
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium mr-2">Catégorie:</span>
                          <span className="text-sm">{announcement.wordpress_category_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <MessageSquareText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium mr-2">Nombre de mots:</span>
                        <span className="text-sm">{countWords(announcement.description)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {announcement.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{announcement.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Actions */}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleGoBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux annonces
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <h3 className="text-lg font-medium">Annonce non trouvée</h3>
                <p className="text-muted-foreground mt-2">
                  L'annonce que vous recherchez n'existe pas ou vous n'avez pas les droits pour y accéder.
                </p>
                <Button variant="secondary" onClick={handleGoBack} className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux annonces
                </Button>
              </div>
            )}
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementDetail;
