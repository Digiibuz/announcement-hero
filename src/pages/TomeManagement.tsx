
import React, { useState, useEffect } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/users/AccessDenied";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TomeCategories from "@/components/tome/TomeCategories";
import TomeLocalities from "@/components/tome/TomeLocalities";
import TomePublications from "@/components/tome/TomePublications";
import TomeSimplified from "@/components/tome/TomeSimplified";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Routes, Route, useNavigate } from "react-router-dom";
import TomePublicationDetail from "@/components/tome/TomePublicationDetail";

const TomeManagement = () => {
  const { isAdmin, user } = useAuth();
  const isClient = user?.role === "client";
  const { configs, isLoading, fetchConfigs } = useWordPressConfigs();
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && configs.length > 0 && !selectedConfigId) {
      // Pour les clients, on sélectionne automatiquement leur configuration WordPress
      if (isClient && user?.wordpressConfigId) {
        setSelectedConfigId(user.wordpressConfigId);
      } else {
        setSelectedConfigId(configs[0].id);
      }
    }
  }, [configs, isLoading, selectedConfigId, isClient, user]);

  // Fonction de rafraîchissement pour le bouton
  const handleRefresh = () => {
    fetchConfigs();
    toast.success("Configurations WordPress mises à jour");
  };

  // Si l'utilisateur n'est ni admin ni client, on affiche une page d'accès refusé
  if (!isAdmin && !isClient) {
    return (
      <PageLayout title="Tom-E">
        <AccessDenied />
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Tom-E" onRefresh={handleRefresh}>
        <AnimatedContainer delay={200}>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-64">
                <div className="animate-pulse text-muted-foreground">
                  Chargement des configurations...
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </PageLayout>
    );
  }

  if (configs.length === 0) {
    return (
      <PageLayout title="Tom-E" onRefresh={handleRefresh}>
        <AnimatedContainer delay={200}>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">
                  Aucune configuration WordPress
                </h3>
                <p className="text-muted-foreground mb-4">
                  Veuillez d'abord ajouter une configuration WordPress dans la section "Gestion WordPress".
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </PageLayout>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PageLayout 
            title="Tom-E" 
            onRefresh={handleRefresh}
          >
            <AnimatedContainer delay={200}>
              {/* Informations sur l'état de la connexion WordPress */}
              <div className="mb-4 flex justify-between items-center">
                {selectedConfigId && <WordPressConnectionStatus configId={selectedConfigId} showDetails={true} />}
              </div>
              
              {/* Alerte d'information concernant le WAF */}
              <Alert className="mb-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Protection anti-bot WordPress</AlertTitle>
                <AlertDescription>
                  Certains hébergeurs WordPress (comme o2switch) utilisent un pare-feu (WAF) qui peut bloquer 
                  la publication automatisée. Tom-E génère vos articles et les sauvegarde pour publication manuelle.
                </AlertDescription>
              </Alert>

              {/* Pour les clients, on ne montre pas le sélecteur de configuration */}
              {!isClient && (
                <div className="mb-6">
                  <select 
                    className="w-full md:w-64 p-2 border rounded-md" 
                    value={selectedConfigId || ""}
                    onChange={(e) => setSelectedConfigId(e.target.value)}
                  >
                    {configs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedConfigId && (
                <Tabs defaultValue="publications">
                  <TabsList className="w-full mb-6">
                    <TabsTrigger value="publications" className="flex-1">Publications</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1">Catégories & Mots-clés</TabsTrigger>
                    <TabsTrigger value="localities" className="flex-1">Localités</TabsTrigger>
                  </TabsList>
                  <TabsContent value="publications">
                    <TomePublications configId={selectedConfigId} isClientView={isClient} />
                  </TabsContent>
                  <TabsContent value="categories">
                    <TomeCategories configId={selectedConfigId} isClientView={isClient} />
                  </TabsContent>
                  <TabsContent value="localities">
                    <TomeLocalities configId={selectedConfigId} isClientView={isClient} />
                  </TabsContent>
                </Tabs>
              )}
            </AnimatedContainer>
          </PageLayout>
        } 
      />
      <Route 
        path="/new" 
        element={
          <PageLayout 
            title="Nouvelle publication" 
            onBack={() => navigate("/tome")}
          >
            <AnimatedContainer delay={200}>
              {selectedConfigId && (
                <TomeSimplified configId={selectedConfigId} isClientView={isClient} />
              )}
            </AnimatedContainer>
          </PageLayout>
        } 
      />
      <Route 
        path="/:id" 
        element={
          <PageLayout 
            title="Détail de la publication" 
            onBack={() => navigate("/tome")}
          >
            <AnimatedContainer delay={200}>
              <TomePublicationDetail />
            </AnimatedContainer>
          </PageLayout>
        } 
      />
    </Routes>
  );
};

export default TomeManagement;
