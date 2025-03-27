
import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";
import WordPressConfigList from "@/components/wordpress/WordPressConfigList";
import AccessDenied from "@/components/users/AccessDenied";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

const WordPressManagement = () => {
  const { isAdmin } = useAuth();
  const { 
    configs, 
    isLoading, 
    isSubmitting,
    createConfig, 
    updateConfig,
    deleteConfig
  } = useWordPressConfigs();
  
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
                  <WordPressConfigForm 
                    onSubmit={createConfig}
                    buttonText="Ajouter une configuration"
                    dialogTitle="Ajouter une nouvelle configuration WordPress"
                    dialogDescription="Créez une nouvelle configuration pour un site WordPress."
                    isSubmitting={isSubmitting}
                  />
                </div>

                <WordPressConfigList 
                  configs={configs}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                  onUpdateConfig={updateConfig}
                  onDeleteConfig={deleteConfig}
                />
              </div>
            </AnimatedContainer>
          )}
        </div>
      </main>
    </div>
  );
};

export default WordPressManagement;
