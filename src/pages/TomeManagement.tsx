
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
import TomeAutomation from "@/components/tome/TomeAutomation";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import TomePublicationForm from "@/components/tome/TomePublicationForm";
import TomePublicationDetail from "@/components/tome/TomePublicationDetail";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const TomeManagement = () => {
  const {
    isAdmin,
    user
  } = useAuth();
  const isClient = user?.role === "client";
  const {
    configs,
    isLoading,
    fetchConfigs
  } = useWordPressConfigs();
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  
  // Force component rerender when selectedConfigId changes
  const [key, setKey] = useState(0);
  // Default active tab
  const [activeTab, setActiveTab] = useState("publications");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const configIdFromUrl = queryParams.get('configId');

    if (configIdFromUrl) {
      const configExists = configs.some(config => config.id === configIdFromUrl);
      if (configExists) {
        setSelectedConfigId(configIdFromUrl);
        return;
      }
    }

    if (!isLoading && configs.length > 0 && !selectedConfigId) {
      if (isClient && user?.wordpressConfigId) {
        setSelectedConfigId(user.wordpressConfigId);
      } else {
        setSelectedConfigId(configs[0].id);
      }
    }
  }, [configs, isLoading, selectedConfigId, isClient, user, location.search]);

  // Handle config selection change
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    // Force rerender of child components when config changes
    setKey(prevKey => prevKey + 1);
    // Update the URL with the new config ID
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('configId', configId);
    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString()
    });
  };

  const handleRefresh = () => {
    fetchConfigs();
    toast.success("Configurations WordPress mises à jour");
  };

  if (!isAdmin && !isClient) {
    return <PageLayout title="Tom-E">
        <AccessDenied />
      </PageLayout>;
  }

  if (isLoading) {
    return <PageLayout title="Tom-E" onRefresh={handleRefresh}>
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
      </PageLayout>;
  }

  if (configs.length === 0) {
    return <PageLayout title="Tom-E" onRefresh={handleRefresh}>
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
      </PageLayout>;
  }

  const tabsContent = (
    <>
      <TabsContent value="publications">
        <TomePublications key={`pub-${key}-${selectedConfigId}`} configId={selectedConfigId!} isClientView={isClient} />
      </TabsContent>
      {!isClient && <TabsContent value="automation">
        <TomeAutomation key={`auto-${key}-${selectedConfigId}`} configId={selectedConfigId!} />
      </TabsContent>}
      <TabsContent value="categories">
        <TomeCategories key={`cat-${key}-${selectedConfigId}`} configId={selectedConfigId!} isClientView={isClient} />
      </TabsContent>
      <TabsContent value="localities">
        <TomeLocalities key={`loc-${key}-${selectedConfigId}`} configId={selectedConfigId!} isClientView={isClient} />
      </TabsContent>
    </>
  );

  // Desktop and Mobile tabs rendering
  const renderTabs = () => {
    if (isMobile) {
      return (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} key={`tabs-${key}`}>
          <div className="flex justify-between items-center mb-4">
            <ScrollArea className="w-[85%]">
              <TabsList className="mb-4 flex w-max">
                <TabsTrigger value="publications">Publications</TabsTrigger>
                {!isClient && <TabsTrigger value="automation">Automatisation</TabsTrigger>}
                <TabsTrigger value="categories">Catégories</TabsTrigger>
                <TabsTrigger value="localities">Localités</TabsTrigger>
              </TabsList>
            </ScrollArea>
            
            {!isClient && (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Settings size={20} />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-2">Sélection du site</h4>
                    <select 
                      className="w-full p-2 border rounded-md" 
                      value={selectedConfigId || ""} 
                      onChange={e => handleConfigChange(e.target.value)}
                    >
                      {configs.map(config => (
                        <option key={config.id} value={config.id}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
          
          {tabsContent}
        </Tabs>
      );
    }
    
    // Desktop version
    return (
      <Tabs defaultValue="publications" key={`tabs-${key}`}>
        <div className="mb-6">
          {!isClient && (
            <select 
              className="w-full md:w-64 p-2 border rounded-md mb-4" 
              value={selectedConfigId || ""} 
              onChange={e => handleConfigChange(e.target.value)}
            >
              {configs.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
          )}
          
          <TabsList className="w-full">
            <TabsTrigger value="publications" className="flex-1">Publications</TabsTrigger>
            {!isClient && <TabsTrigger value="automation" className="flex-1">Automatisation</TabsTrigger>}
            <TabsTrigger value="categories" className="flex-1">Catégories & Mots-clés</TabsTrigger>
            <TabsTrigger value="localities" className="flex-1">Localités</TabsTrigger>
          </TabsList>
        </div>
        
        {tabsContent}
      </Tabs>
    );
  };

  return <Routes>
      <Route path="/" element={<PageLayout title="Tom-E" onRefresh={handleRefresh}>
            <AnimatedContainer delay={200}>
              <div className="mb-4">
                {selectedConfigId && <WordPressConnectionStatus configId={selectedConfigId} showDetails={!isMobile} />}
              </div>
              
              {selectedConfigId && renderTabs()}
            </AnimatedContainer>
          </PageLayout>} />
      <Route path="/new" element={<PageLayout title="Nouvelle publication" onBack={() => navigate("/tome")}>
            <AnimatedContainer delay={200}>
              {selectedConfigId && <TomePublicationForm configId={selectedConfigId} isClientView={isClient} />}
            </AnimatedContainer>
          </PageLayout>} />
      <Route path="/:id" element={<PageLayout title="Détail de la publication" onBack={() => navigate("/tome")}>
            <AnimatedContainer delay={200}>
              <TomePublicationDetail />
            </AnimatedContainer>
          </PageLayout>} />
    </Routes>;
};

export default TomeManagement;
