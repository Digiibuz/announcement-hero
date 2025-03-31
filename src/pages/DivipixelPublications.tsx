
"use client"

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar, Eye, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DivipixelPublication } from "@/types/divipixel";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";

const DivipixelPublications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [publications, setPublications] = useState<DivipixelPublication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const fetchPublications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("divipixel_publications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPublications(data || []);
    } catch (error) {
      console.error("Error fetching publications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500 hover:bg-green-600";
      case "scheduled":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="outline" className="border-green-500 text-green-500">Publié</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Planifié</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Brouillon</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy, HH:mm", { locale: fr });
  };

  return (
    <PageLayout
      title="Publications Divipixel"
      titleAction={
        <Button onClick={() => navigate("/divipixel-publications/create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Créer une publication
        </Button>
      }
    >
      <AnimatedContainer delay={100}>
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <p>Chargement...</p>
          </div>
        ) : publications.length === 0 ? (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Aucune publication Divipixel</CardTitle>
              <CardDescription>
                Vous n'avez pas encore créé de publication Divipixel.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/divipixel-publications/create")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Créer une publication
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
            {publications.map((publication) => (
              <Card key={publication.id} className="overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight line-clamp-2">{publication.title}</CardTitle>
                    {getStatusBadge(publication.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-3 flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(publication.created_at)}</span>
                  </div>
                  {publication.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{publication.description}</p>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/divipixel-publications/${publication.id}`)} className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/divipixel-publications/edit/${publication.id}`)} className="flex items-center gap-1.5">
                    <Edit className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  {publication.wordpress_post_id && (
                    <Button variant="outline" size="sm" asChild className="flex items-center gap-1.5">
                      <a href="#" target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        WordPress
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </AnimatedContainer>
    </PageLayout>
  );
};

export default DivipixelPublications;
