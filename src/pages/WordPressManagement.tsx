
import React from "react";
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

  const { categories, hasCategories } = useWordPressCategories();
  const { pages, hasPages } = useWordPressPages();
  
  // Fonction wrapper pour adapter le type de retour
  const handleCreateConfig = async (data: { 
    name?: string; 
    site_url?: string; 
    rest_api_key?: string; 
    username?: string; 
    password?: string; 
  }) => {
    await createConfig(data as Omit<WordPressConfig, "id" | "created_at" | "updated_at">);
    return;
  };

  // Fonction wrapper pour adapter le type de retour
  const handleUpdateConfig = async (id: string, data: Partial<WordPressConfig>) => {
    await updateConfig(id, data);
    return;
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
