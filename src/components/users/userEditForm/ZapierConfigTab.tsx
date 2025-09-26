import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ZapierConfigTabProps {
  form: UseFormReturn<any>;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const ZapierConfigTab: React.FC<ZapierConfigTabProps> = ({
  form,
  isUpdating,
  onCancel,
  onSubmit,
}) => {
  const zapierUrl = form.watch("zapier_webhook_url");
  const hasZapierConfig = zapierUrl && zapierUrl.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Boutons d'action en haut */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
          {isUpdating ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {/* Statut de la configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Statut de la configuration Zapier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {hasZapierConfig ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Configuration Zapier active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-700">Aucune configuration Zapier</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {hasZapierConfig 
                  ? "L'utilisateur peut publier sur les réseaux sociaux via Zapier"
                  : "L'utilisateur ne peut pas utiliser la fonction de publication sur les réseaux sociaux"
                }
              </p>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration du webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="zapier_webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL du webhook Zapier</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://hooks.zapier.com/hooks/catch/..."
                            type="url"
                          />
                        </FormControl>
                        <FormDescription>
                          Copiez l'URL du webhook depuis votre Zap Zapier. Cette URL sera utilisée pour déclencher 
                          automatiquement la publication sur les réseaux sociaux.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Comment configurer Zapier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">1. Créer un nouveau Zap</p>
                  <p className="text-muted-foreground">Connectez-vous à Zapier et créez un nouveau Zap</p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">2. Trigger : Webhooks by Zapier</p>
                  <p className="text-muted-foreground">Choisissez "Catch Hook" comme déclencheur</p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">3. Action : Réseaux sociaux</p>
                  <p className="text-muted-foreground">
                    Connectez Facebook, Instagram, LinkedIn, Twitter ou autres plateformes
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">4. Configurer les données</p>
                  <p className="text-muted-foreground">
                    Utilisez les données envoyées : title, socialContent, images, publishDate, hashtags
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">5. Copier l'URL du webhook</p>
                  <p className="text-muted-foreground">Collez l'URL générée dans le champ ci-dessus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ZapierConfigTab;