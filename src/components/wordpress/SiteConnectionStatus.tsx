
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWordPressConfigsList } from "@/hooks/wordpress/useWordPressConfigsList";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import WordPressConnectionStatus from "./WordPressConnectionStatus";

const SiteConnectionStatus = () => {
  const { user } = useAuth();
  const { getUserConfigs } = useWordPressConfigsList();
  const { categories, isLoading: isCategoriesLoading, error: categoriesError, hasCategories } = useWordPressCategories();
  const [userSites, setUserSites] = useState<any[]>([]);

  useEffect(() => {
    const configs = getUserConfigs();
    setUserSites(configs);
    
    // Log pour le debug
    console.log("User WordPress configs:", configs);
    console.log("User WordPress categories:", categories);
  }, [user]);

  if (!user) {
    return null;
  }

  // Si aucun site n'est assigné
  if (userSites.length === 0) {
    return (
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            <p>Aucun site WordPress n'est associé à votre compte.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Site WordPress</CardTitle>
      </CardHeader>
      <CardContent>
        {userSites.map((site) => (
          <div key={site.id} className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{site.name}</h3>
                <a
                  href={site.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1"
                >
                  {site.site_url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <WordPressConnectionStatus 
                configId={site.id} 
                showDetails
                className="mt-0"
              />
            </div>
            
            <div className="text-sm mt-2">
              <div className="flex items-center gap-2">
                <span>Catégories:</span>
                {isCategoriesLoading ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Chargement...
                  </Badge>
                ) : categoriesError ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Erreur
                  </Badge>
                ) : hasCategories ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {categories.length} catégories disponibles
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Aucune catégorie
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SiteConnectionStatus;
