
import React, { useEffect } from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import WordPressConfigList from "@/components/wordpress/WordPressConfigList";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";
import AccessDenied from "@/components/users/AccessDenied";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import type { WordPressConfig } from "@/types/wordpress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WordPressManagement = () => {
  const { isAdmin, user } = useAuth();
  const { 
    configs, 
    isLoading, 
    isSubmitting,
    createConfig, 
    updateConfig,
    deleteConfig
  } = useWordPressConfigs();

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
  
  // Vérifie que la configuration WordPress de l'utilisateur est correctement définie
  useEffect(() => {
    if (user && !user.wordpressConfigId && configs.length > 0) {
      console.log("User has no WordPress config assigned but configs exist. Suggesting to set a config.");
    }
  }, [user, configs]);

  const handleCreateConfig = async (data: { 
    name?: string; 
    site_url?: string; 
    rest_api_key?: string; 
    app_username?: string; 
    app_password?: string; 
  }) => {
    try {
      const newConfig = await createConfig(data as Omit<WordPressConfig, "id" | "created_at" | "updated_at">);
      
      // Si l'utilisateur n'a pas de configuration associée, associons automatiquement celle-ci
      if (user && !user.wordpressConfigId && newConfig) {
        const { error } = await supabase
          .from('profiles')
          .update({ wordpress_config_id: newConfig.id })
          .eq('id', user.id);
        
        if (!error) {
          // Recharge la page pour mettre à jour le contexte utilisateur
          toast.success("Configuration WordPress associée à votre compte");
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error creating config:", error);
    }
  };

  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    await updateConfig(id, data);
    
    // Si on met à jour la configuration actuelle de l'utilisateur, actualisons les données
    if (user?.wordpressConfigId === id) {
      refetchCategories();
      refetchPages();
    }
  };
  
  const renderContentError = (error: string | null) => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de connexion</AlertTitle>
        <AlertDescription>
          {error}. Vérifiez les informations d'identification et réessayez.
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
            Sélectionnez ou créez une configuration WordPress et associez-la à votre compte.
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
          {!isAdmin ? (
            <AccessDenied />
          ) : (
            <AnimatedContainer>
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Gestion des configurations WordPress</h1>
                  <div className="flex items-center gap-3">
                    {user?.wordpressConfigId && (
                      <WordPressConnectionStatus 
                        configId={user.wordpressConfigId} 
                        showDetails={true}
                      />
                    )}
                    <WordPressConfigForm 
                      onSubmit={handleCreateConfig}
                      buttonText="Ajouter une configuration"
                      dialogTitle="Ajouter une nouvelle configuration WordPress"
                      dialogDescription="Créez une nouvelle configuration pour un site WordPress."
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </div>

                <Tabs defaultValue="configs" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="configs">Configurations</TabsTrigger>
                    <TabsTrigger value="content">Contenu WordPress</TabsTrigger>
                  </TabsList>

                  <TabsContent value="configs" className="space-y-4">
                    <WordPressConfigList 
                      configs={configs}
                      isLoading={isLoading}
                      isSubmitting={isSubmitting}
                      onUpdateConfig={handleUpdateConfig}
                      onDeleteConfig={deleteConfig}
                    />
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    {renderEmptyState()}
                    {renderContentError(categoriesError || pagesError)}
                    
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
                          ) : !hasCategories ? (
                            <p className="text-sm text-muted-foreground">
                              Aucune catégorie trouvée
                            </p>
                          ) : (
                            <ul className="space-y-1 text-sm">
                              {categories.map(category => (
                                <li key={category.id} className="flex items-center justify-between">
                                  <span>{category.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ID: {category.id}
                                  </span>
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
                          ) : !hasPages ? (
                            <p className="text-sm text-muted-foreground">
                              Aucune page trouvée
                            </p>
                          ) : (
                            <ul className="space-y-1 text-sm">
                              {pages.map(page => (
                                <li key={page.id} className="flex items-center justify-between">
                                  <span>{page.title.rendered}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {page.status}
                                  </span>
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
          )}
        </div>
      </main>
    </div>
  );
};

export default WordPressManagement;
