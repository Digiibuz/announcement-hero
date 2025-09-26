import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface ZapierConfigFieldProps {
  form: UseFormReturn<any>;
  showForRoles?: string[];
}

const ZapierConfigField: React.FC<ZapierConfigFieldProps> = ({ 
  form, 
  showForRoles = ["client", "commercial", "editor"] 
}) => {
  const role = form.watch("role");
  
  if (!showForRoles.includes(role)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Configuration Zapier
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="zapier_webhook_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Webhook Zapier</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  type="url"
                />
              </FormControl>
              <FormDescription>
                URL du webhook Zapier pour la publication automatique sur les réseaux sociaux. 
                Ce webhook sera déclenché lors de la création d'annonces avec l'option réseaux sociaux activée.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ZapierConfigField;