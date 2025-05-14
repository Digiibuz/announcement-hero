
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle, AlertTriangle, Loader2, TestTube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWordPressConnection, ConnectionResult } from "@/hooks/wordpress/useWordPressConnection";
import { WordPressConfig } from "@/types/wordpress";

interface WordPressConfigFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: WordPressConfig;
}

const WordPressConfigForm = ({ onSubmit, isSubmitting, initialData }: WordPressConfigFormProps) => {
  const [activeTab, setActiveTab] = useState("app-password");
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const { isChecking, testConnection } = useWordPressConnection();

  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      site_url: initialData?.site_url || "",
      app_username: initialData?.app_username || "",
      app_password: initialData?.app_password || "",
      rest_api_key: initialData?.rest_api_key || "",
      username: initialData?.username || "",
      password: initialData?.password || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      // Déterminer l'onglet actif en fonction des données existantes
      if (initialData.app_username && initialData.app_password) {
        setActiveTab("app-password");
      } else if (initialData.rest_api_key) {
        setActiveTab("api-key");
      } else if (initialData.username && initialData.password) {
        setActiveTab("basic-auth");
      }
      
      // Définir les valeurs du formulaire
      form.reset({
        name: initialData.name,
        site_url: initialData.site_url,
        app_username: initialData.app_username || "",
        app_password: initialData.app_password || "",
        rest_api_key: initialData.rest_api_key || "",
        username: initialData.username || "",
        password: initialData.password || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: any) => {
    // Préparer les données en fonction de l'onglet actif
    const formData = {
      name: data.name,
      site_url: data.site_url,
      // Réinitialiser toutes les valeurs d'authentification
      app_username: null,
      app_password: null,
      rest_api_key: null,
      username: null,
      password: null,
    };

    // Ajouter uniquement les informations d'authentification de l'onglet actif
    if (activeTab === "app-password") {
      formData.app_username = data.app_username;
      formData.app_password = data.app_password;
    } else if (activeTab === "api-key") {
      formData.rest_api_key = data.rest_api_key;
    } else if (activeTab === "basic-auth") {
      formData.username = data.username;
      formData.password = data.password;
    }
    
    onSubmit(formData);
  };

  const handleTestConnection = async () => {
    const currentValues = form.getValues();
    
    // Créer un objet de configuration temporaire pour le test
    const testConfig: WordPressConfig = {
      id: initialData?.id || "",
      name: currentValues.name,
      site_url: currentValues.site_url,
      app_username: activeTab === "app-password" ? currentValues.app_username : null,
      app_password: activeTab === "app-password" ? currentValues.app_password : null,
      rest_api_key: activeTab === "api-key" ? currentValues.rest_api_key : null,
      username: activeTab === "basic-auth" ? currentValues.username : null,
      password: activeTab === "basic-auth" ? currentValues.password : null,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: initialData?.updated_at || new Date().toISOString()
    };
    
    const result = await testConnection(testConfig);
    setConnectionResult(result);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la configuration</FormLabel>
              <FormControl>
                <Input required placeholder="Site Web du Client" {...field} />
              </FormControl>
              <FormDescription>
                Nom unique pour identifier cette configuration WordPress
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="site_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL du site WordPress</FormLabel>
              <FormControl>
                <Input 
                  required 
                  placeholder="https://www.example.com" 
                  type="url" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                L'adresse complète de votre site WordPress (avec https://)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-md p-4 space-y-4">
          <Label>Méthode d'authentification</Label>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="app-password" className="flex-1">
                Mot de passe d'application
              </TabsTrigger>
              <TabsTrigger value="api-key" className="flex-1">
                Clé API REST
              </TabsTrigger>
              <TabsTrigger value="basic-auth" className="flex-1">
                Basic Auth
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="app-password">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="app_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="app_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe d'application</FormLabel>
                      <FormControl>
                        <Input placeholder="XXXX XXXX XXXX XXXX XXXX XXXX" {...field} />
                      </FormControl>
                      <FormDescription>
                        Créé dans le profil WordPress (Utilisateurs &gt; Profil &gt; Mots de passe d'application)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="api-key">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="rest_api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clé API REST</FormLabel>
                      <FormControl>
                        <Input placeholder="eyJhbGciOiJIUzI1..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Généré par un plugin comme JWT Authentication ou similaire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="basic-auth">
              <div className="space-y-4">
                <Alert className="bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Cette méthode est moins sécurisée. Utilisez un mot de passe d'application si possible.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {connectionResult && (
          <Alert className={connectionResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            {connectionResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={connectionResult.success ? "text-green-800" : "text-red-800"}>
              {connectionResult.message}
              {connectionResult.success && connectionResult.hasCustomPost && (
                <div className="mt-2 text-green-700">
                  ✓ Plugin DipiPixel détecté
                </div>
              )}
              {connectionResult.success && connectionResult.hasCategories && (
                <div className="text-green-700">
                  ✓ Catégories disponibles
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-3 items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isChecking || !form.getValues().site_url}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Tester la connexion
              </>
            )}
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WordPressConfigForm;
