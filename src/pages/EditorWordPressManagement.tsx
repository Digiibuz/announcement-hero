
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { Loader2, AlertCircle, Globe, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EditorWordPressManagement = () => {
  const { user, isEditor } = useAuth();
  const navigate = useNavigate();
  const [wordpressInfo, setWordpressInfo] = useState<{name: string, site_url: string} | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Redirect admin users to the full WordPress management page
  useEffect(() => {
    if (!isEditor) {
      navigate('/wordpress');
    }
  }, [isEditor, navigate]);

  // Get WordPress info for the current user
  useEffect(() => {
    if (user?.wordpressConfig) {
      setWordpressInfo({
        name: user.wordpressConfig.name,
        site_url: user.wordpressConfig.site_url
      });
    }
  }, [user]);

  const { 
    categories, 
    hasCategories, 
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useWordPressCategories();
  
  const { 
    pages, 
    hasPages, 
    isLoading: isPagesLoading,
    error: pagesError,
    refetch: refetchPages
  } = useWordPressPages();

  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      toast.info("Actualisation des données WordPress en cours...");
      
      await Promise.all([
        refetchCategories(),
        refetchPages()
      ]);
      
      toast.success("Données WordPress actualisées avec succès");
    } catch (error) {
      console.error("Error refreshing WordPress data:", error);
      toast.error("Erreur lors de l'actualisation des données");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const renderContentError = (error: string | null) => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de connexion</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-2 text-sm">
            <strong>Résolution:</strong> L'utilisateur WordPress associé à votre compte pourrait ne pas avoir les permissions nécessaires.
            Assurez-vous que le rôle "Éditeur" possède bien les capacités <code>manage_categories</code> et <code>edit_terms</code>.
          </div>
        </AlertDescription>
      </Alert>
    );
  };
  
  const renderEmptyState = () => {
    if (!user?.wordpressConfigId) {
      return (
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune configuration WordPress associée</AlertTitle>
          <AlertDescription>
            Un administrateur doit vous attribuer une configuration WordPress pour utiliser cette fonctionnalité.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mon site WordPress</h1>
                <div className="flex items-center gap-3">
                  {user?.wordpressConfigId && (
                    <WordPressConnectionStatus 
                      configId={user.wordpressConfigId} 
                      showDetails={true}
                    />
                  )}
                </div>
              </div>

              {wordpressInfo && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Site configuré
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Nom du site</p>
                        <p className="text-lg font-semibold">{wordpressInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">URL du site</p>
                        <a 
                          href={wordpressInfo.site_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline truncate block"
                        >
                          {wordpressInfo.site_url}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="content" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="content">Contenu WordPress</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  {renderEmptyState()}
                  {renderContentError(categoriesError || pagesError)}
                  
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefreshData}
                      disabled={isRefreshing || isCategoriesLoading || isPagesLoading}
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Actualiser les données
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Catégories WordPress</CardTitle>
                        <CardDescription>
                          Catégories disponibles sur votre site WordPress
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!user?.wordpressConfigId ? (
                          <p className="text-sm text-muted-foreground">
                            Aucune configuration WordPress associée
                          </p>
                        ) : isCategoriesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : categoriesError ? (
                          <p className="text-sm text-red-500">
                            Impossible de récupérer les catégories
                          </p>
                        ) : !hasCategories ? (
                          <p className="text-sm text-muted-foreground">
                            Aucune catégorie trouvée ou l'utilisateur n'a pas les permissions nécessaires
                          </p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {categories.map(category => (
                              <li key={category.id} className="flex items-center justify-between">
                                <span>{category.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  ID: {category.id}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pages WordPress</CardTitle>
                        <CardDescription>
                          Pages disponibles sur votre site WordPress
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!user?.wordpressConfigId ? (
                          <p className="text-sm text-muted-foreground">
                            Aucune configuration WordPress associée
                          </p>
                        ) : isPagesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : pagesError ? (
                          <p className="text-sm text-red-500">
                            Impossible de récupérer les pages
                          </p>
                        ) : !hasPages ? (
                          <p className="text-sm text-muted-foreground">
                            Aucune page trouvée ou l'utilisateur n'a pas les permissions nécessaires
                          </p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {pages.map(page => (
                              <li key={page.id} className="flex items-center justify-between">
                                <span>{page.title.rendered}</span>
                                <Badge variant="outline" className="text-xs">
                                  {page.status}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default EditorWordPressManagement;
