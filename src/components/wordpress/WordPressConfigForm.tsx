
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SaveIcon, Loader2 } from "lucide-react";
import { WordPressConfig } from '@/types/wordpress';
import { Separator } from '@/components/ui/separator';

interface WordPressConfigFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: WordPressConfig;
  isLoading?: boolean;
}

const WordPressConfigForm: React.FC<WordPressConfigFormProps> = ({ 
  onSubmit, 
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    site_url: '',
    username: '',
    password: '',
    app_username: '',
    app_password: '',
    rest_api_key: '',
    prompt: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        site_url: initialData.site_url || '',
        username: initialData.username || '',
        password: initialData.password || '',
        app_username: initialData.app_username || '',
        app_password: initialData.app_password || '',
        rest_api_key: initialData.rest_api_key || '',
        prompt: initialData.prompt || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuration WordPress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la configuration</Label>
              <Input
                id="name"
                name="name"
                placeholder="Mon site WordPress"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_url">URL du site</Label>
              <Input
                id="site_url"
                name="site_url"
                placeholder="https://monsite.com"
                value={formData.site_url}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                URL complète du site sans slash final
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="prompt">Description de l'activité (prompt pour Tom-E)</Label>
            <Textarea
              id="prompt"
              name="prompt"
              placeholder="Décrivez l'activité de votre entreprise en détail..."
              value={formData.prompt}
              onChange={handleChange}
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              Ce texte sera utilisé par Tom-E pour générer du contenu pertinent pour votre activité.
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Authentification REST API</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ces informations sont nécessaires pour la publication automatique.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_username">Nom d'utilisateur Application</Label>
                <Input
                  id="app_username"
                  name="app_username"
                  placeholder="admin"
                  value={formData.app_username}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_password">Mot de passe Application</Label>
                <Input
                  id="app_password"
                  name="app_password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.app_password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default WordPressConfigForm;
