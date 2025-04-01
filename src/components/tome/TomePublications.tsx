
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Loader2, FileEdit, Eye, ExternalLink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { TomeGeneration } from "@/types/tome";

interface TomePublicationsProps {
  configId: string;
  isClientView?: boolean;
}

const TomePublications: React.FC<TomePublicationsProps> = ({ configId, isClientView = false }) => {
  const navigate = useNavigate();
  const [generations, setGenerations] = React.useState<TomeGeneration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchGenerations = React.useCallback(async () => {
    if (!configId) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Récupérer les données de génération directement
      const { data, error } = await supabase
        .from("tome_generations")
        .select("*")
        .eq("wordpress_config_id", configId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching generations:", error);
        toast.error("Erreur lors du chargement des générations: " + error.message);
        return;
      }

      // Récupérer les informations du site WordPress
      const { data: wpConfig } = await supabase
        .from("wordpress_configs")
        .select("site_url")
        .eq("id", configId)
        .single();

      // Enrichir les données avec l'URL du site
      const enhancedGenerations = data.map(gen => ({
        ...gen,
        wordpress_site_url: wpConfig?.site_url || null
      }));

      setGenerations(enhancedGenerations);
    } catch (error: any) {
      console.error("Error in fetchGenerations:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchGenerations();
  }, [configId, fetchGenerations]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{isClientView ? "Vos publications" : "Publications"}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchGenerations()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/tome/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle publication
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isClientView ? "Vos publications" : "Liste des publications"}
          </CardTitle>
          <CardDescription>
            Gérez vos publications, qu'elles soient en brouillon, publiées ou planifiées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {isClientView 
                  ? "Aucune publication n'a encore été créée pour votre site" 
                  : "Aucune publication n'a été créée"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/tome/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première publication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((generation) => {
                let statusLabel = "";
                let statusColor = "";
                
                switch (generation.status) {
                  case 'draft':
                    statusLabel = "Brouillon";
                    statusColor = "bg-amber-100 text-amber-800";
                    break;
                  case 'pending':
                    statusLabel = "En attente";
                    statusColor = "bg-blue-100 text-blue-800";
                    break;
                  case 'processing':
                    statusLabel = "En cours";
                    statusColor = "bg-blue-100 text-blue-800";
                    break;
                  case 'scheduled':
                    statusLabel = "Planifiée";
                    statusColor = "bg-purple-100 text-purple-800";
                    break;
                  case 'published':
                    statusLabel = "Publiée";
                    statusColor = "bg-green-100 text-green-800";
                    break;
                  case 'failed':
                    statusLabel = "Échec";
                    statusColor = "bg-red-100 text-red-800";
                    break;
                  default:
                    statusLabel = generation.status;
                    statusColor = "bg-gray-100 text-gray-800";
                }
                
                return (
                  <div key={generation.id} className="border rounded-md p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="w-full md:w-3/4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${statusColor}`}>
                            {statusLabel}
                          </span>
                          
                          {generation.status === 'scheduled' && generation.scheduled_at ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Publication prévue le {format(new Date(generation.scheduled_at), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </Badge>
                          ) : generation.published_at ? (
                            <span className="text-sm text-muted-foreground">
                              Publiée le {format(new Date(generation.published_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Créée le {format(new Date(generation.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-medium">
                          {generation.title || "Publication sans titre"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2 mb-2 md:mb-0"
                          onClick={() => navigate(`/tome/${generation.id}`)}
                        >
                          {generation.status === 'draft' ? (
                            <>
                              <FileEdit className="h-4 w-4" />
                              <span>Modifier</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>Voir</span>
                            </>
                          )}
                        </Button>
                        
                        {generation.wordpress_post_id && (
                          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-2 md:mb-0" asChild>
                            <a 
                              href={`${generation.wordpress_site_url || '#'}${isClientView ? `/?p=${generation.wordpress_post_id}` : `/wp-admin/post.php?post=${generation.wordpress_post_id}&action=edit`}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {isClientView ? "Voir la page" : "Voir dans WordPress"}
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TomePublications;
